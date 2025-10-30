---
title: "Google File System"
date: 2025-10-30
categories:
  - Databases
tags: ["learn", "distributed", "databases"]
---

# Parts of GFS

GFS (Google File System) is a reliable distributed file system that is built on top of unreliable commodity machines.

Commodity machines break down, and they break down pretty often, and given that there are many such machines, at any given moment it is a miracle if all the machines are working fine.

So, it must constantly monitor itself and detect, tolerate, and recover from component failures regularly.

# System Requirements

- **Building Blocks** : As GFS is a file system that is built on top of commodity machines which fail a lot... it requires constant monitoring, must detect failures, and automatically recover.
- **Storage Needs** : The system must be able to store millions of files, and multi-GB files are really common, but it should also support small files.
- **WorkLoads**
  - Reads : Reads are mostly large sequential reads (major requirement), with a few random reads at a given offset.
  - Writes : Mostly appends to a file (major requirement), with \*\*\*\*a few writes at a given offset.

# General Architecture Of GFS

there are mainly two types of servers

- **Master Server** : It is like a leader that handles and governs everything. All reads and writes must initially go through the master server. It stores file-to-chunk mapping and chunk-to-chunk-servers mapping.
- **Chunk Server** : These are worker server, which store the chunks.

## How Does GFS Store Data

Say we have to store something really large, of size say 1 TB. We can only store it on a single computer if it has enough storage. And if it does not have enough storage, the next best thing to do is to chop up the file into several chunks and store those chunks on several machines.

GFS mostly does the same; here a file is stored as several **64 MB** chunks across several servers. The servers which store these chunks are called chunk servers. Also, these chunks are replicated across multiple servers for **high** **availability** and **redundancy**.

Each chunk is identified by an immutable and globally unique **64-bit chunk handle.**

> This technique of splitting is very widely used in Virtual Memory in Operating Systems and TCP (fragmentation and reconstruction).

Now we know that a single file is split into multiple chunks and stored across several servers. So how do reads, writes, and deletes work in GFS??

# Read Flow

Reads are pretty simple in GFS.

{{< svg "2025-10-30-google-file-system/readflow.svg" >}}

1. The application asks the GFS client, "I want to read this file and this offset."
2. The GFS client translates the offset into a chunk number and asks the master for the chunk servers from where the client can read this chunk from.
3. The master server returns a set of chunk servers corresponding to the chunk along with the chunk handle.
4. The client then asks those chunk servers for the chunk.
5. Finally...!! The chunk will be transferred from the chunk server to the client.

That’s for the happy path…

### **Handling Failures**

Here, the major failure occurs when the chunk server is down. In that case, the client can just ask another chunk server for the chunk, as the master server would have shared the location of all the chunk servers where the chunk is stored.

# Write Flow

It is the writes that are complex... There are different types of writes:

- **Writes**: Data to be written at a specific offset.
- **Record Appends**: Append record (data) to the file.

For me, it was the write part of GFS that was quite a bit confusing... There are many variables here: what if the write is greater than chunk size, what if the write fails, and so on.

## Writes at Offset Data Flow

{{< svg "2025-10-30-google-file-system/writeflow.svg" >}}

When we have writes, concurrent writes are always the problem... The major solution for concurrent writes is a single source of truth or some sort of leader.

Each chunk is replicated across multiple chunk servers, and to handle these writes across multiple chunk servers, the master uses a technique called **lease management,** where one of the chunk servers acts as primary and others act as secondary. To edit that chunk, the write command must pass through the primary replica.

When a client wants to write at a particular offset in a file:

1. The client first asks the master for the chunk servers.
2. The master gives the client the chunk handle and chunk server locations.
3. Once the client knows about the primary and secondary chunk servers, The client starts sharing the data to be written with all the chunk servers.
   - Here, as you see in the diagram, the file is first sent to the secondary server A, and the secondary server A then sends data to the primary server, and again, the primary server sends data to the next secondary server B. Here the data is shared in a **pipeline** fashion in order to maximize the network bandwidth. The client shares the data with the server that is closest to it (here, it is the secondary server A), and then the chunk server shares the data with another chunk server that is closest to it, and so on…
   - It's not like the secondary server A waits for the entire data to be transferred and then sends it to the next server. It would be very slow. As soon as it has some data, it starts pushing it to the next server.
   - The chunk servers will not yet commit these writes but will just store them in an LRU Buffer Cache.
4. Once the data transfer is complete, the client receives an acknowledgment for the data transfer from all the chunk servers.
5. Then the client issues a write command to the primary chunk server. Here, there can be multiple concurrent writes happening, but the primary chunk server gives these writes an order. It is just like saying, "You go first, you go second, and you go third," and so on…
6. Then it applies the writes to its chunk in the given order, and it then tells other secondary servers to do the same.
7. Secondary replicas acknowledge the writes to the primary replica.
8. Finally, the primary replica sends an acknowledgment to the client, concluding the write successfully.

Now all the chunk servers have the writes in the same order. And that's the happy path. And many things can go wrong here, like the primary chunk server might fail, or the secondary chunk servers might fail, or the chunk might get corrupted, and so on.…

### **Handling Failures**

Here the main solution for handling failures is **retrying** the operation again and again. Primary replica fails... retry. Secondary replica fails... retry.…
Retries would not be a problem, as writes at a particular offset would not lead to duplication even on retries. That is because here the client is trying to edit the same region again and again. Failures would just leave the chunk in an undefined state; however, a successful retry would just overwrite it with defined data.

### Few Interesting Bits

GFS separates control flow and data flow, where data flow is the transfer of data between the servers and control flow is like the issuing of commands, requests, or giving instructions.

This separation allows multiple clients to transfer files (data flow) to chunk servers without blocking one another, as the actual write takes place only when the primary chunk server issues a write command (control flow).

## Record Append Data Flow

In an append record flow, the client just gives GFS the data to be written, and GFS appends it and gives back the client the offset where it wrote.

Record append is similar to the write flow, but here, the chunk is just the last chunk of the file. GFS has a few extra steps in order to guarantee atomicity even when there are concurrent writers, such as the maximum size of the record being limited to 16 MB; this is to reduce fragmentation.

In the record append data flow, similar to the write operation, the client sends the data to the primary and the secondary chunk servers. When the client issues the append operation to the primary chunk server, the primary chunk server first checks if it fits in the current chunk. If it does, then the record is written, and its offset is returned to the client.

If the record does not fit in, then the primary chunk server pads the data, asks secondary servers to do the same, and asks the client to retry on the next chunk. Now the client retries by asking the master for the next chunk, which does not exist yet. So the master allocates a new chunk and replies to the client with the new chunk. Now the data is written in the new chunk.

### Handling Failures

Here, just like with writes at offset and reads... the way of handling failures is retries. But the catch here is that, unlike writes at an offset, record appends lead to duplicates, but given the workload of the system, it is generally fine, and the GFS client can also be configured to handle duplicates.

> GFS promises that record append writes to the chunks at least once.

## Concurrent Writes at Offset and Record Append Operations

Concurrent writes at offset might leave the chunk in an undefined but consistent state, but that is not quite the case for record appends here.

- Consistent state ⇒ all the chunk servers see the same data.
- Defined state ⇒ a client sees what it writes

Here is an example.

Let's assume there is a chunk with the following state: 1 2 3 4 5 6 7 8 9 10.

{{< svg "2025-10-30-google-file-system/chunk-state-1.svg" >}}

Client A wants to write the data AAAAAAAAAA at an offset 0.

Client B wants to write BBBBBB at offset 5.

Here, even though these operations are serialized with the help of lease management, it still leads to an undefined state.

Let's assume Client A's write operation goes first, then Client B's write operation. This would leave the chunk in the following state: `A A A A A B B B B B B`

{{< svg "2025-10-30-google-file-system/chunk-state-2.svg" >}}

So, here the state is undefined because even though Client A's write is successful, it does not see all the data it wrote. But this is not the case with record appends.

On concurrent record appends, it is not possible as GFS is not writing the data at an offset but tries to add the data to the end of the file. Again, the writes are ordered by the primary, so all concurrent writes are serialized. Here, let's assume there is enough space in the chunk for both Client A's and Client B's data, and the primary first appends Client B's record, then Client A's record. This would leave the chunk in the following state:
`1 2 3 4 5 6 7 8 9 10 B B B B B B A A A A A A A A A A`

{{< svg "2025-10-30-google-file-system/chunk-state-3.svg" >}}

Here, when the concurrent writes are successful, it leaves the system in a defined state.

Along with reads and writes, there are many parts of GFS that keep the system up and running…

# Deletion and Garbage Collection

Deletion and Garbage Collection Deletion in GFS is a bit interesting. It just renames the file name to a hidden name. The name includes the timestamp of the deletion, and it is kept in the metadata for some time, like 3 days by default (configurable). During this duration, the file can be recovered.

The master server periodically scans the metadata, and during these periodic scans of the file system, if the hidden file is older than 3 days, it deletes it from the metadata (remember, chunks in the chunk servers are not yet deleted), making all the chunks of the file orphan, i.e., not reachable.

When the heartbeat messages are exchanged and the master notices that the chunks are orphaned, the master tells the chunk servers to delete the chunk.

# Other Parts of GFS

### Heartbeats

The master and the chunk servers communicate periodically through heartbeat messages. These messages are really important, as the states of the chunk servers and commands to the chunk servers are all piggybacked onto these heartbeat messages.

### Handling Stale Data

So... what if a chunk server goes down, a write happens, and after a long time the chunk server comes back up? Now the chunk server holds stale data. How is this handled?

Stale data is handled by using a version number. Each chunk is given a version number, which is incremented during mutations, i.e., writes or record appends.

It is through the heartbeats that a chunk server tells the master about the chunks that it has and the versions of the chunks.

The master notices that other chunk servers holding the same chunk handle have a newer version. It simply considers the chunk to not exist at all, making it an orphan chunk which will be removed during garbage collection, and it issues re-replication in order to maintain the replication factor of the chunk.

# The Master….

## Metadata

The master stores the following metadata:

- File and chunk namespaces
- The mapping from files to chunks
- Location of chunk replicas

File and chunk namespaces and the mapping of files to chunks. This metadata is persisted by logging changes to the operation log.

## **Operation Logs**

The operation log is similar to WAL (Write-Ahead Log) in databases: before making any changes, first write to disk, make the change, and reply to the client.

The operation log is also replicated to other servers for redundancy so that whenever the master goes down, when it comes back up, it replays the operation log to recover the state of the "file and chunk namespace" and "files to chunks mappings.”

o speed up recovery, it uses checkpointing. A checkpoint is like a snapshot of namespaces and file-to-chunk mappings. Whenever the size of the log is greater than a certain threshold, the master switches to a new log file and, along with it, creates a new checkpoint in another thread.

> These structures are designed in such a way that a new checkpoint can be created without delaying incoming mutations.

So... whenever it comes back up, it should only replay a few logs from the most recent checkpoint.

Additionally, the master also does a lot of things, such as rebalancing chunks by moving them to different chunk servers.

## Rebalancing Chunks

There are several things the master considers regarding chunk placements:

- All chunks must be placed on different racks.
- It places chunks on chunk servers with below-average disk utilization.
- Place the chunks on chunk servers which do not have any recent writes/chunk placements.

# Back to Failures…

Now, getting back to failures, what if a chunk gets corrupted??

Here, to determine the integrity of the chunk, **checksums** are used. Every 64 KB has a 32-bit checksum.

There are mainly two ways in which the chunk server finds out it has corrupted chunks:

1. During Regular Chunk Scanning ⇒ The chunk server regularly scans the chunks for their integrity.
2. During Client Reads ⇒ When a client wants to read a chunk, the chunk server first checks the checksums before sending the chunk to the client.

During these scenarios, if the chunk server finds out that the chunk is corrupted, it tells the master, and the master issues a replication from another chunk server.

Now... what if a chunk server fails??

When a chunk server fails, it does not send heartbeat messages. The master notices the absence of heartbeats, which decreases the replication factor of the chunks belonging to that chunk server, and now to maintain the replication factor of the chunks (here, replication factor just means how many replicas of the chunk should be present), the master server creates a new replica of the chunk.

# One More Final Interesting Thing

Here, in order to maintain high availability, GFS uses something called a shadow server. GFS maintains a shadow master server. As the name implies, the shadow master server is a bit stale.

This shadow master server serves the Read Operation when the master is down and it also keeps itself up to date by reading the operation logs of the master server. This shadow master server greatly improves read availability when the master goes down.

GFS looks really simple, but it's quite complex with so many moving parts. Hope you enjoyed the read and now better understand GFS. Next up is the RAFT consensus algorithm.
