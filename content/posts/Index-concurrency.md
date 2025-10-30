---
title: "Index Concurrency"
date: 2024-07-17
categories:
  - Databases
tags: ["learn", "database", "databases"]
---

This blog summaries the [**lecture 8**](https://www.youtube.com/watch?v=jcqGSehrMGU) of cmu - Intro to Database Systems along with some things i learned on the way.

### Concurrency and Parallelism

**Parallelism**:

Parallelism means running multiple tasks simultaneously. It can be achieved with the help of multiple cores, multiple threads, GPUs, etc.

_Example_: In programming, running two different functions at the same time.

**Concurrency**:

Concurrency refers to the ability to run tasks out of order without changing the final outcome. Tasks can progress independently, and generally, these tasks are interleaved. This means the CPU might execute a part of one task, then stop and execute a part of another task, and so on.

_Example_: In programming, if a program has two functions, say `f1` and `f2`, where running these two functions in any order does not change the outcome, the result is the same whether `f1` runs before `f2` or `f2` runs before `f1`. In this case, we can say that the program supports concurrency and these functions are concurrent.

### Concurrency in Index

**Why do we need the index to be concurrent?**
We need the index to be concurrent to support the execution of multiple transactions at once and to allow for maximum system throughput. Concurrency enables tasks such as reading, writing, updating, and deleting to be executed out of order. By allowing multiple transactions to be executed out of order, we can run these transactions in parallel while ensuring that the final output remains correct.

However, when multiple transactions modify the index simultaneously, we must handle cases where one transaction might be reading a tuple while another transaction is changing it. In such scenarios, the output expected by the first transaction could be corrupted. To handle these cases, we introduce concurrency control mechanisms.

**What do we mean by correct output?** There are two main criteria:

**Logical correctness:** Logical correctness means that when a thread writes a tuple and then reads the same tuple again, it should see the tuple it wrote initially, provided that no other thread has updated it. This ensures that the data seen by a transaction is consistent with its own operations and the operations of other threads as managed by the concurrency control protocol.

**Physical correctness:** Physical correctness means that the data structure remains sound. This means it is not corrupted, does not hold pointers to invalid memory locations, and does not skip nodes or contain other structural errors. This ensures that the underlying data structure of the index is intact and operational.

### Locks and Latches

As we discussed above, if one transaction is reading a node in an index and another transaction comes along and changes the node, the result expected by the first transaction can be corrupted. This means that the first transaction might read part of the node before the other transaction has made changes and the remaining part after the changes have been made. As a result, the output received by the initial transaction will be inconsistent. To handle these issues, we mainly use techniques such as locks, latches, and atomic transactions.

Even though locks and latches sound similar, they are a bit different:

**Locks:**
Locks protect the contents of the database, such as tuples and relations, from being modified by other transactions while a transaction is performing operations on them. Locks are held for the entire duration of the transaction and support rollbacks if something goes wrong.

_Example:_ If a transaction is updating a tuple in a table, a lock is acquired on that tuple to prevent it from being modified by other transactions at the same time.

**Latches:**
Latches are used to protect the low-level data structures of the DBMS, such as indexes, page tables, etc. Latches are typically held for a short duration and do not need to provide rollbacks.

_Example:_ Using a latch to protect a node in an index from being modified by other transactions.

### Different ways of Latch implementation

**Blocking OS Mutex**

We can use the mutex (mutual exclusion) functionality provided by the OS to protect shared data from being modified simultaneously.

In mutexes, we acquire a latch on the part of the shared data we are trying to modify. When another thread tries to modify the same part of the shared data, it is not allowed and is put into a waiting queue. Other threads will only be able to access the data when the initial thread holding the latch releases it. Here, the latching and unlatching are handled by the OS, which can be slow.

A faster alternative in Linux is the futex, which reduces the number of system calls. For DBMSs, the DBMS itself can often do a better job of handling latches for internal data structures.

**Test and Set Spin Latch**

Before the introduction of the test and set spin latch, the testing and setting of the latch used to be done with two different instructions. Think of a latch as a simple boolean value holding either false (0) or true (1).

- **Testing**: A thread checks the state of the latch. True means it’s latched, and false means it’s unlatched.

Sometimes, it can happen that a thread checks the value of the latch and sees that it’s unlatched. Before it can acquire the latch (set it to true), the thread might be preempted (stopped) for some reason. During this time, another thread might check the latch value, see that it’s unlatched, acquire the latch, and continue its execution. When the CPU resumes the initial thread, it thinks the latch is still unlatched and acquires it. Now, we have two threads doing changes simultaneously, leading to unexpected errors.

To resolve this, the test and set instruction is used.

In the test and set instruction, testing and setting are combined into one atomic instruction. This ensures that either the thread gets the latch or it doesn’t, with no intermediate state where the latch can be acquired by multiple threads.

**Spin Latch**: A spin latch means that the thread will repeatedly execute the test_and_set instruction until it acquires the latch.

**Reader-Writer Latches**

The problem with mutexes and test-and-set latches is that they don’t differentiate between the types of work being done by the threads. For example, if we have 10 threads that want to read some value, using a mutex or test-and-set latch would require each thread to wait for its turn to acquire the lock, which is inefficient.

Reader-writer latches solve this by introducing two types of latches: reader latches and writer latches. When threads are only reading the contents without modifying them, multiple threads can acquire multiple reader latches on the same critical section simultaneously. However, if a thread needs to modify the content, it uses a writer latch. A writer latch is an exclusive latch that can only be acquired when there are no reader or writer latches currently held.

### Implementation of Latches in Hash tables

In hash tables, only a single slot is accessed by a thread at a time. By providing latches for the slots, we can support concurrency. This is true, but the implementation can vary based on the size of the critical section being protected.

There are two different types of latches based on the size of the critical section they protect:

- **Page Latches:**
  - Here, latching and unlatching are done at the page level. If a thread wants to access a single slot, it acquires a latch on the entire page. This can put other threads into the waiting queue if they want to access slots in the same page. However, it simplifies the process for the thread holding the latch to read multiple slots within the same page.
- **Slot Latches:**
  - Here, latching and unlatching are done at the slot level. If a thread wants to access a single slot, it acquires a latch only on that specific slot. This allows other threads to access different slots within the same page simultaneously. However, this approach requires maintaining a latch for every single slot in the hash table, which can be very expensive.

### Implementation of Latches in B+Trees

implementation of latches in B+Trees is far more complex then the implementation of Latches in the hash table as in B+Trees a single thread might need to access multiple nodes and might also modify multiple nodes.

**Using Simple Reader-Writer Latches**

When using reader-writer latches for indexing searches, we start by acquiring a latch on the root node of the B+Tree. As we proceed, we keep acquiring latches on the child nodes until we reach the leaf node, and finally, we acquire a latch on it. All the latches are held until the completion of the operation.

It’s not much of a problem if multiple threads want to search for a key-value pair and only acquire read latches. However, issues arise when we need to make changes. To modify the B+Tree, a thread needs to acquire a write latch. A write latch is exclusive, meaning only one write latch can be held at a time. If a thread wants to insert a new key-value pair into a B+Tree index, it needs to acquire a latch on the root node and maintain it until the leaf node where the insertion will take place. During this time, no other reads or writes can be performed because the root node is latched.

This causes a bottleneck and slows down the application. We solve this issue by implementing a few additional rules known as the crabbing latch protocol.

**Using Crabbing Latch Protocol**

Now, let's see what a crab has to do with latches!

In the Crabbing Latch Protocol, we prevent the bottleneck problem by following a pattern of acquiring and releasing latches. For example, if we want to search for a key-value pair, we first acquire a read latch on the root node, then a new read latch on its child node. Once the latch on the child node is acquired, we release the latch on the root node. This pattern of acquiring and releasing latches continues as we traverse down the tree.

Acquiring write latches is a bit more complex because writing might lead to node splits, merges, or changes in the tree length. Before delving into each case, let's define what a safe node is.

**Safe Node:** A safe node is a node that can neither be split nor merged with other nodes if a new value is inserted or deleted from that node.

Similar to acquiring read latches, we first acquire a write latch on the root node and then on its child node. We then check if the child node is a safe node. If it is, it guarantees that even if a merge or split happens below the child node, it does not affect the root node(parent node). If the child node is safe, we release the latch on the root node(parent node). If it is not, we keep the latch and continue our traversal down the tree.

However, for each write operation, we need to acquire a write latch on the root node, which can also lead to a bottleneck. Although it's not as severe as before, it still slows down the system. To solve this, we make a slight modification.

**Improved Crabbing Latch Protocol**

The reading process remains the same as before, but the handling of write latches is slightly modified.

Initially, we use read latches for write operations as well. We traverse down the tree, acquiring read latches along the way. When we reach the leaf node, we check if we need to split or merge. If there is no need to split or merge, we simply perform the insertion or deletion.

However, if a split or merge is needed, we restart the process, but this time by acquiring the write latches, just as before.

**handling Leaf Node Scans**

Leaf node scans allow for traversal in different directions: left to right, top to bottom, and right to left. This flexibility can lead to potential deadlocks. For example, if thread A is waiting for thread B to release a latch and vice versa, a deadlock occurs.

To handle this situation, the best approach would be for one of the threads to detect the deadlock, wait for a specified amount of time, and then abort itself. This way, the deadlock is resolved, and the aborted thread (e.g., thread A) can restart its operation.
