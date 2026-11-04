---
title: "False Sharing: When Four Threads Were Slower Than One"
date: 2026-11-04
draft: true
categories:
  - Databases
tags: ["learn", "database", "databases", "rust", "performance"]
---

I was going through turborel, and I found this really, really interesting problem, which points to the core of how CPUs work, and how cache lines work.

Before digging deep into it, here is some context on how things work. A CPU has several cores, and every core runs in parallel. Every core has its own cache, which holds memory in blocks called cache lines, and the size of each cache line is 64 bytes.

Now, on to the problem. Reading pages on four threads was slower than reading them on one:

| Pages read per second | 1 thread | 4 threads |
| --- | --- | --- |
| Before the fix | 136,955 | 108,750 |

The problem was a counter. In Rust, whenever an object is shared by several threads through an `Arc`, that object has a counter that keeps track of how many threads are using the object, or in how many places the object is used. We add +1 to that counter when it's referenced in a new place, and -1 when it's no longer referenced, so that whenever it hits 0, we just free the memory. All these increments and decrements are atomic operations.

Now, we have a CRC object, and this CRC object has the settings. Those settings are used to compute the CRC of a given page.

Here is the usual flow of a thread which is reading a page:

1. It reads the page.
2. It gets the CRC object.
3. It does the CRC run to verify the hash.
4. It returns whether the page is good or in a bad state.

Whenever a thread gets the CRC object, the counter is incremented by 1, and whenever the function is done with it, the counter is decremented by 1. In the code, the counter is incremented by 1, we do the CRC run, and the counter is decremented by 1:

```rust
// src/disk/pager/sealed.rs (trimmed)
fn unseal(&self, id: u64, page: &[u8]) -> Result<Option<&[u8]>> {
    let keyed = self.hash.current().keyed();      // +1, then -1 at the end of the line
    // ...
    let verified = match name.map(|name| self.hash.verifier(name)) {   // +1
        Some(Ok(hash)) => hash.hash(signed).as_bytes() == digest,      // the CRC run
        // ...
    };                                            // -1: the copy is dropped here
    // ...
}

// src/disk/pager/named.rs
fn current(&self) -> Arc<dyn HashFunction> {
    Arc::clone(&lock_builtin(&self.current))      // Arc::clone is the +1
}
```

Here, we are incrementing the counter by 2 because we are making 2 references within the same function, and we decrement the counter by 2 again.

If we take a look at the problem, there are two main things:

- the counter
- the object (the settings of the CRC)

The settings of the CRC stay the same no matter how many threads there are. No matter what we are doing, they stay the same, but the counter is something that we are doing a lot of writes to.

The reason that the counter and the CRC object are in the same cache line is because that's how Rust allocates an `Arc` on the heap: the counter and the object go into one block of memory, with the counter first.

```rust
// How the standard library lays out an Arc (simplified)
#[repr(C)]
struct ArcInner<T> {
    strong: AtomicUsize,   // the counter: bytes 0-7
    weak: AtomicUsize,     // bytes 8-15
    data: T,               // our CRC object: starts at byte 16
}
```

Now, what was happening is that we have two cores and two threads: thread A and thread B. Thread A is running on one core, and thread B is running on another core. They are both running in parallel.

Thread A fetches a page. After fetching the page, it goes through the usual step of incrementing the reference count, and then it gets started with its CRC run and checksum check.

While thread A is doing the CRC run, thread B fetches another page (one that is not in its cache), and then it increments the counter.

Here, the problem is that each core keeps its own copy of the 64-byte cache line. Whenever thread B writes to the counter, A's copy of that line has to be invalidated. Thread A then waits for the line to be refreshed. It takes several CPU cycles for the line to come from B's cache to A's cache.

{{< svg "2026-11-04-false-sharing/shared-line.svg" "Before: B's +1 on the counter invalidates A's whole line, including the CRC settings A is reading." >}}

What is happening here is that thread A only reads the CRC settings, but its cache line gets invalidated because B wrote something to the counter. With four threads, someone is always writing to the counter, so every core keeps refetching settings that never changed.

Here, the solution was to add padding and separate them. In Rust, this is one line on the CRC object:

```rust
// src/hash/crc.rs
#[repr(align(128))]   // the object must start at a multiple of 128 bytes
pub struct Crc {
    params: CrcParams,
    shift: u32,
    tables: Box<[Table; SLICES]>,
}
```

Usually, Intel CPUs fetch cache lines in pairs. So I needed to add more padding, 128 bytes and not just 64, so that both are far away from each other. Now the counter sits at bytes 0-15 and the CRC object starts at byte 128.

{{< svg "2026-11-04-false-sharing/apart.svg" "After: B's +1 invalidates only the counter's line. The CRC settings stay valid in A's cache." >}}

And a test makes sure the layout does not quietly change:

```rust
#[test]
fn a_crc_lies_apart_from_the_counts_of_its_sharers() {
    assert_eq!(align_of::<Crc>(), 128);
    assert!(size_of::<Crc>() >= 128);
}
```

The result:

| Pages read per second, 4 threads | |
| --- | --- |
| Before the fix | 108,750 |
| After the fix | 430,000 to 470,000 |
