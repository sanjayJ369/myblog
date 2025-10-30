#!/usr/bin/env python3
"""
Convert SVG hardcoded colors to CSS variables for dark theme support.
This script processes Excalidraw SVGs and replaces color values with CSS variables.

The key insight: 
- Text/background colors are theme-aware (light/dark swap)
- Accent colors are preserved but with theme-appropriate variations
"""

import os
import re
from pathlib import Path
from typing import Dict, Set
import colorsys

def hex_to_rgb(hex_color: str) -> tuple:
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb: tuple) -> str:
    """Convert RGB tuple to hex color"""
    return '#{:02x}{:02x}{:02x}'.format(int(rgb[0]), int(rgb[1]), int(rgb[2]))

def get_color_brightness(hex_color: str) -> float:
    """Calculate perceived brightness of a color (0-255)"""
    r, g, b = hex_to_rgb(hex_color)
    # Perceived luminance formula
    return (r * 299 + g * 587 + b * 114) / 1000

def get_color_category(hex_color: str) -> str:
    """Categorize color as text, background, or accent"""
    brightness = get_color_brightness(hex_color)
    
    if brightness < 50:
        return "text"  # Dark colors
    elif brightness > 200:
        return "background"  # Light colors
    else:
        return "accent"  # Medium colors - these have semantic meaning

def extract_colors(svg_content: str) -> Set[str]:
    """Extract all hex color values from SVG content"""
    hex_pattern = r'#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?'
    colors = set(re.findall(hex_pattern, svg_content))
    # Normalize to 6-digit format
    normalized = set()
    for color in colors:
        if len(color) == 4:
            normalized.add('#' + ''.join([c*2 for c in color[1:]]))
        else:
            normalized.add(color.lower())
    return normalized

def create_color_mapping(svg_files: list) -> tuple:
    """
    Create intelligent color mapping that preserves color significance.
    - Dark text colors -> --svg-text-primary
    - Light backgrounds -> --svg-bg-light
    - Accent colors -> --svg-accent-N with specific handling
    
    Returns: (mapping, text_colors, bg_colors, accent_colors)
    """
    all_colors = set()
    
    for svg_file in svg_files:
        try:
            with open(svg_file, 'r', encoding='utf-8') as f:
                content = f.read()
                colors = extract_colors(content)
                all_colors.update(colors)
        except Exception as e:
            print(f"Warning: Could not read {svg_file}: {e}")
    
    # Categorize colors
    text_colors = set()
    bg_colors = set()
    accent_colors = set()
    
    for color in all_colors:
        category = get_color_category(color)
        if category == "text":
            text_colors.add(color)
        elif category == "background":
            bg_colors.add(color)
        else:
            accent_colors.add(color)
    
    mapping = {}
    
    # Map text colors to primary text variable
    for color in text_colors:
        mapping[color] = "--svg-text-primary"
    
    # Map background colors to light background variable
    for color in bg_colors:
        mapping[color] = "--svg-bg-light"
    
    # Map accent colors - each gets its own variable
    for i, color in enumerate(sorted(accent_colors), 1):
        mapping[color] = f"--svg-accent-{i}"
    
    return mapping, text_colors, bg_colors, accent_colors

def convert_svg_to_css_vars(svg_content: str, color_mapping: Dict[str, str]) -> str:
    """Replace hex colors with CSS variable references in SVG"""
    result = svg_content
    
    # Sort by length (longest first) to avoid partial replacements
    for hex_color in sorted(color_mapping.keys(), key=len, reverse=True):
        var_name = color_mapping[hex_color]
        # Replace in various contexts: fill, stroke, stop-color, etc.
        result = re.sub(
            rf'{re.escape(hex_color)}(?=[\s"\']|>)',
            f'var({var_name})',
            result,
            flags=re.IGNORECASE
        )
    
    return result

def replace_colors_in_styles(svg_content: str, color_mapping: Dict[str, str]) -> str:
    """
    Replace hardcoded colors with CSS variables inside <style> tags.
    Keeps fonts and other styling intact.
    """
    def replace_in_style_tag(match):
        style_content = match.group(1)
        
        # Replace hex colors with CSS variables in style content
        for hex_color in sorted(color_mapping.keys(), key=len, reverse=True):
            var_name = color_mapping[hex_color]
            # Replace color values: before colon, after colon with spaces/no space
            pattern = r':\s*' + re.escape(hex_color) + r'([\s;}}])'
            replacement = f': var({var_name})\\1'
            style_content = re.sub(
                pattern,
                replacement,
                style_content,
                flags=re.IGNORECASE
            )
        
        return f'<style{match.group(0)[6:-8]}>{style_content}</style>'
    
    # Find and process all style tags
    svg_content = re.sub(
        r'<style[^>]*>(.*?)</style>',
        replace_in_style_tag,
        svg_content,
        flags=re.DOTALL | re.IGNORECASE
    )
    
    return svg_content

def process_svg_file(svg_path: str, color_mapping: Dict[str, str], accent_colors: set) -> tuple:
    """Process a single SVG file and convert colors to CSS variables"""
    try:
        with open(svg_path, 'r', encoding='utf-8') as f:
            svg_content = f.read()
        
        # Replace colors in internal style tags
        converted = replace_colors_in_styles(svg_content, color_mapping)
        
        # Convert colors in attributes to CSS variables
        converted = convert_svg_to_css_vars(converted, color_mapping)
        
        # Write back to file
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(converted)
        
        return True, f"✓ {Path(svg_path).name}"
    except Exception as e:
        return False, f"✗ {Path(svg_path).name}: {e}"

def generate_css_file(output_path: str, accent_colors: set) -> None:
    """Generate CSS file with theme variables"""
    
    # Build accent color mappings for light mode (keep original or slightly adjusted)
    accent_css_light = []
    accent_css_dark = []
    
    # Map specific colors intelligently
    color_mapping_scheme = {
        "#e03131": {"light": "#d73a49", "dark": "#ff7b72"},  # Red -> Bright Red
        "#f08c00": {"light": "#f08c00", "dark": "#ffa657"},  # Orange -> Bright Orange
        "#15aabf": {"light": "#15aabf", "dark": "#56d4dd"},  # Cyan -> Bright Cyan
        "#f59f00": {"light": "#f59f00", "dark": "#ffb954"},  # Amber -> Bright Amber
        "#5c940d": {"light": "#5c940d", "dark": "#7ee787"},  # Green -> Bright Green
    }
    
    for i, color in enumerate(sorted(accent_colors), 1):
        if color in color_mapping_scheme:
            light_val = color_mapping_scheme[color]["light"]
            dark_val = color_mapping_scheme[color]["dark"]
        else:
            # For unknown accent colors, keep them in light mode, brighten in dark
            light_val = color
            # Make it brighter for dark mode
            r, g, b = hex_to_rgb(color)
            brightness = get_color_brightness(color)
            if brightness < 100:
                # Darken colors -> brighten them
                factor = 1.5
            else:
                factor = 1.2
            dark_r = min(255, int(r * factor))
            dark_g = min(255, int(g * factor))
            dark_b = min(255, int(b * factor))
            dark_val = rgb_to_hex((dark_r, dark_g, dark_b))
        
        accent_css_light.append(f"  --svg-accent-{i}: {light_val};")
        accent_css_dark.append(f"  --svg-accent-{i}: {dark_val};")
    
    css_content = f"""/* SVG Theme Variables - Auto-generated
   Keep accent colors meaningful while swapping text/background for theme support
*/

/* Light Mode */
:root {{
  --svg-text-primary: #1e1e1e;
  --svg-text-secondary: #4a5a52;
  --svg-bg-light: #ffffff;
  --svg-bg-subtle: #f3f3f3;
  --svg-border: #bcc3bc;
  --svg-accent-secondary: #6b7b73;
{chr(10).join(accent_css_light)}
}}

/* Dark Mode */
.dark {{
  --svg-text-primary: #c8e6c9;
  --svg-text-secondary: #a5d6a7;
  --svg-bg-light: #1e293b;
  --svg-bg-subtle: #0f172a;
  --svg-border: #334155;
  --svg-accent-secondary: #66bb6a;
{chr(10).join(accent_css_dark)}
}}
"""
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(css_content)
        print(f"\n✓ CSS file generated: {Path(output_path).name}")
    except Exception as e:
        print(f"✗ Error writing CSS file: {e}")

def main():
    workspace_root = Path("/mnt/bd35e3c5-97dd-4f09-b8e4-b939a3398e0b/coding/repos/myblog")
    static_dir = workspace_root / "static/images"
    
    svg_files = list(static_dir.rglob("*.svg"))
    
    if not svg_files:
        print("No SVG files found in static/images directory")
        return
    
    print(f"\n{'='*60}")
    print(f"SVG Theme Converter - Intelligent Color Mapping")
    print(f"{'='*60}\n")
    print(f"Found {len(svg_files)} SVG file(s)\n")
    
    # Create intelligent color mapping
    print("Analyzing colors...")
    color_mapping, text_colors, bg_colors, accent_colors = create_color_mapping([str(f) for f in svg_files])
    
    print(f"\nColor Categories Found:")
    print(f"  Text colors (dark):      {text_colors or 'None'}")
    print(f"  Background colors (light): {bg_colors or 'None'}")
    print(f"  Accent colors:           {accent_colors or 'None'}")
    
    print(f"\nColor Mapping:")
    for color, var_name in sorted(color_mapping.items()):
        brightness = get_color_brightness(color)
        print(f"  {color} (brightness: {brightness:3.0f}) -> {var_name}")
    
    # Process SVGs
    print(f"\nConverting SVG files...\n")
    success_count = 0
    for svg_file in sorted(svg_files):
        success, message = process_svg_file(str(svg_file), color_mapping, accent_colors)
        print(f"  {message}")
        if success:
            success_count += 1
    
    # Generate CSS
    print(f"\n{'-'*60}")
    css_output = workspace_root / "assets/css/extended/svg-theme-vars.css"
    generate_css_file(str(css_output), accent_colors)
    
    print(f"\n{'='*60}")
    print(f"✓ Successfully converted {success_count}/{len(svg_files)} files")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
