---
title: "internet basics"
date: 2024-01-16
categories:
  - Blog
tags: ["learn", "network"]
---

## How information is sent across the internet?

Internet is a network of networks, billions of computers interconnect make the internet, information is sent across the internet in the form of packets, packets can be thought of a little containers of data, if you want to share an image to your friend, first the large image is broken down into number of packets, and these packets are transferred to your friend’s computer, in your friends computer they are reordered and assembled together(not necessarily) to form the image

## What are packets?

Packets in the internet closely resembles the a post in real life, just like the letter in the post they have some digital data to carry and like the to and from addresses on the envelope, packets have an IP Header, IP Header is like the address of the houses, it contains source and destination IP of the computers along with other stuff

## How do these packets actually travel?

Packets travel from hopping from one router to another, when a package is sent it fist goes to router which is provided by ISP(internet service provider) to which we are connected to, and then it goes from one router to another, how does the router decide on which direction to send the packet?, router does that from looking at the packet header, which contains the destination IP address, then it looks at a table(routing table), table contains directions and corresponding destination IP address, and now it directs the packets in the correct direction, the router also considers other factors such as network traffic etc

## What is a protocol?

Protocols are a set of rules that are agreed upon by the computers, which facilitate the communication between them, just like how two persons should know the rules of the language to communicate in that language.

There are many protocols some of them are IP, TCP, UDP, HTTP

Lets take about each of them now

### IP (internet protocol):

IP stands for internet protocol, IP can be thought of as a set of rules by which the packets are sent and received over the internet, all the devices which use IP has a unique IP address which is used by other devices to identify that device and also by routers to direct the packets to it. IP takes care of identifying the devices, routing the packets and breaking down and reassembling the packets into larger files

### TCP (transmission control protocol):

TCP operates on a layer above IP, TCP takes care of the things like inorder delivery of the packets, TCP maintains a reliable communication, that TCP makes sure that all the packets are received and they are received in order, TCP makes request to the sender for the missing packets if there are any, TCP also takes care of the thing like flow control and congestion control, flow control and congestion control govern the rate of transmission of packets.

### UDP (user datagram protocol):

UDP is used if we want to make faster communication, UDP doesn’t guarantee the packet delivery and also doesn’t deliver the packets in order, but transmission is way faster then TCP and is generally used for online game, live streaming and voice calls, the terms datagrams and protocols are used interchangeably but the key difference is that we use the terms datagram when there is un guaranteed delivery of the packet

### HTTP (hypertext transfer protocol):

HTTP is a that governs the data transfer, it is primary used to transfer text data but images, audio and videos can also be transferred, it is based on response request model, where client makes a request to the server and the server responds back, it provides different methods for different types of request for example GET to request data, POST to send the data, PUT to change the existing data
