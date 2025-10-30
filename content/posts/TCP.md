---
title: "TCP"
date: 2024-01-21
categories:
  - Blog
tags: ["learn", "network", "internet"]
---

**TCP stands for Transmission Control Protocol.** It's built upon the IP layer and provides features like reliable packet transmission, flow control, congestion control, and congestion avoidance.

**Why is TCP the most used protocol?**

TCP is widely used because of the features it offers, such as reliable packet transmission, flow control, and others. Reliable transmission ensures data arrives complete and in order, making it crucial for applications like file transfers, email, and web browsing.

**What does reliable packet transmission mean?**

When packets travel over the internet, they can get lost or corrupted. Reliable transmission guarantees that all packets arrive at their destination complete and in the correct order. If a packet is lost or corrupted, TCP detects it using checksums and requests the sender to resend it. This ensures accurate and complete data exchange.

**What is flow control?**

Think of flow control like regulating water flow from a large tank to a small cup. If the water flows too fast, the cup overflows. Similarly, Our computer will have some memory buffer which is used to store the incoming packers before processing, when the server keeps on sending the data and when our ability process them in less, packets will start accumulating in the memory buffer and soon will lead to packet loss due to buffer overflow, to avoid this TCP will keep track of a variable known as receive window (rwnd) both the server and client will have their own receive window, and these are initially exchange during the three-way handshake, when there is a change in rwnd it can again be exchanged between the server and client to keep up with the new requirements

**What is congestion control?**

Two main factors determine your internet speed: bandwidth and receive window. Flow control takes care of the receive window, but what about bandwidth? Imagine you have a 30Mbps connection and the server sends data at 100Mbps. This creates network congestion because your connection can only handle 30Mbps, leading to packet loss. So, how does the server handle this?

The server tracks another variable called "congestion window size (cwnd)" – the amount of data it can send at once. Unlike the receive window, the cwnd is not shared, and for Linux systems, it starts at 4kb. TCP dynamically adjusts the cwnd based on acknowledgments (ACKs) from the client. It increases the cwnd if all packets are received and decreases it if there's any packet loss. There are various congestion control algorithms like Slow Start, Congestion Avoidance, and Fast Retransmit that utilize ACKs to determine the optimal cwnd value, ensuring efficient data transfer without overwhelming the network.

**Bandwidth Delay Product (BDP)**

It \*\*\*\*is the product of a connection's bandwidth and its end-to-end delay (also known as round-trip time). It indicates the maximum amount of unacknowledged data that can be in transit without overwhelming the network or receiver's buffers.

The maximum amount of unacknowledged data in transit is limited to the minimum of the receive window size (RWND) and congestion window size (CWND). This is because:

- If CWND were greater than RWND, the sender might transmit more data than the receiver can handle, leading to buffer overflow and packet loss.
- If RWND were greater than CWND, the sender might not fully utilize available bandwidth, potentially leading to underutilised links.

therefor even if we have sufficient bandwidth our internet speed can be limited due to our receive window
