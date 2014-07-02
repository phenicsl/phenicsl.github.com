Date: 2014-07-01 00:30
Title: Netty代码分析 - Thread Model和Event Loop
Tags: Java Server
Category: Distributed Architecture

利用Java NIO提供的`mulplexing`和`non-blocking io`来处理网络请求, 可以在同一个线程内使用Selector处理多个网络连接, 节省了线程切换的开销，使得服务可以处理大量的并发连接, 程序的性能得到提升. 在Java NIO的基础上，*Netty*规划了线程模型和事件处理架构, 提供了抽象的接口来处理网络请求, 并且保证了程序的可靠性和高性能 ...

<!-- PELICAN_END_SUMMARY -->

和大多数的Java框架类似, *Netty*的设计非常复杂, 程序中存在大量的继承关系，并且使用了很多interface来抽象各个模块之间相互依赖的接口, 但是Netty还是使用了一些并发编程的 Concurrent Patterns, 通过分析， 可以归纳出*Netty*的基本设计思想. 本文基于Netty 4.X版本, 主要关注的是Netty的`Event Loop`设计和`Thread Model`.

## Netty中的Concurrent Patterns
*Netty*中使用了[Reactor][1]模式和`Acceptor-Connector`模式, `IO Multiplexing`由Netty负责, 当具体的connection有可以进行的操作(read/write/accept)时，Netty通过调用注册的开发人员实现的Handler来处理, 对于Netty的使用者， 唯一需要关心的就是`Bootstrap`和`Handler`的实现。 而不需要考虑`IO Multiplexing`. [Rector][1]模式很好的隔离了底层的代码和上层的业务逻辑。另外，通过使用`Acceptor-Connector`模式，将连接的建立和初始化和具体的IO操作分开到不同的Handler. 事实上, 使用`ServerBootstrap`的情况下, Netty提供了`ServerBootstrapAccept`来实现链接建立和初始化的操作.

Netty使用了`Multi-Threading`来处理`Reactor`. 类似于`Leader-Follower`模式, Netty在线程内部进行`IO-Multiplexing`操作和`Handler`的调用，并没有把request分发到别的线程处理. 这样做的好处是可以保证某一个连接都是在相同的线程内执行，可以避免并发访问该连接引发的并发问题. 但与`Leader-Follower`不同的是， Netty没有使用多个线程来进行`accept`, 在Netty中，连接的`accept`是在BOSS线程中进行处理. 而`connection`建立之后， 该`connection`会被注册到WORKER线程中. Netty中使用的是`One EventLoop per Thread`的方式，每一个EventLoop都会对应一个独立的线程， 而每一个连接也会分配到特定的Event Loop上, 线程进行`IO Multiplexing`处理，同时也负责调用相应的Handler. 


## EventLoop

对同一个正在监听的连接， 只会有一个线程进行`accept`操作， 而当`connection`建立之后， 该`connection`会被注册到worker线程进行读写操作. 


用Netty进行网络服务开发，连接的`accept`和数据的`read/write`实际上都是通过`non-blocking`的方式完成, Netty通过`Event Loop`进行`IO Multiplexing`, 当有IO操作可以进行的时候, Netty会调用相应的`Event Handler`来完成操作.

Netty采用的是``One Loop per Thread``的模型, 也就是每一个线程中运行一个`EventLoop`, 而多个具有相同功能的`EventLoop`则组成一个`EventLoopGroup`. 类似下面的样子:

    :::java
	class EventLoopGroup {
	    private EventLoop[] chilren;
	}

在`EventLoopGroup`构造时, 根据指定的线程数大小, Netty会创建给定的`Executor`线程(默认为`ThreadPerTaskExecutor`). 其中每一个线程运行的`run`函数则定义在`NioEventLoop`中.

而每一个`Channel`都会注册到一个特定的EventLoop, 因此某一个`Channel`的所有操作都可以保证是在同一个线程内进行,这也使得使用


[1]: http://en.wikipedia.org/wiki/Reactor_pattern "Reactor"
