Date: 2012-11-10 10:00
Title: Abstract Base Classes Metaclass
Tags: Python
Category: Software Engineering

Since I have started to use [Hyde][1] as my blog site generator. I also have
tried to hack on the [Hyde][1] source code to learn how it is constructued, and
wish I could add some plugins or features to it at last.

When I was reading the source code, I discovered the Hyde is using some python
features that I'm not familiar with. Some of them were added until Python 2.6
which I have not used yet and some of them are "advanced" ones. Once again, it
proved that hacking on other people's source code will greatly improve your
programming knowledge and skill.

This is a post about `abc.ABCMeta`, a metaclass for abstract base classes, which
has been used in Hyde in its Plugin system.

## Abstract Base Classes

> abstract base class (ABC), is a class that cannot be instantiated for it is
> either labled as abstract or it simply specifies abstract methods (or virtual
> methods).

It is the definition of ABC on [wikipedia][2]. As my understanding, Abstract
Base Class(ABC) defines a protocol by means of abstract methods. It requires all
of its inherited classes to provide implementations to those defined abstract
methods, if a concrete implemention for any abstract methods is lack in a
inherited class, then the inherited class is also considered to be abstract and
the system (compiler or interperter) will forbid it from being initialized.

## abc.ABCMeta and abstract methods

`abc.ABCMeta` is instroduced in Python 2.6 to support abstract base classes in
Python language. Here is an example to demostrate how to use abc.ABCMeta.

    #!python
    import abc

    class Abstract_Conf_Parser(object):
        __metaclass__ = abc.ABCMeta
    
        @abc.abstractmethod
        def load(self):
            return
    
        @abc.abstractmethod
        def parse(self, confile):
            return
    
        @abc.abstractmethod
        def unload(self):
            return
        
    class INI_Parser(Abstract_Conf_Parser):
        def load(self):
            print 'load XML Parser'
    
        def unload(self):
            print 'unload XML Parser'
    
        def parse(self, confile):
            print 'parse the file'

Let's say that we have a system with configuration informatoin being stored in
different format(probably not a good idea, but let's assume it is the truth),
like XML, INI text format, or even binary format. So we need to implement
different configuration parsers. To manage all those parsers and also easily add
new ones, we may come up a parser plugin system with code as the above
example.

`Abstract_Conf_Parser` are an abstract base class with `load`, `unload` and
`parser` defined to be abstract methods. `load` and `unload` are two that will
be called when the system load or unload a parser plugin. `parse` is the method
that will be called to parse configuration file. An implementation to parse INI
format configuraiton file also has been provided in the above code.

You may noticed that there is actually not very much difference between normal
inheritance and using `abc.ABCMeta`. We inherited from the abstract base class,
and provide concrete implementions to methods. The only difference is that we make
the metaclass of `Abstract_Conf_Parser` to be `abc.ABCMeta`, and decorated
methods of `Abstract_Conf_Parser` with `@abc.abstractmethod`. It will make those
methods to be abstract and provide the ability to forbid implementations
from being initialized if the implemention of any abstract methods is
missed. For example, say we have a incomplete XML configuration parser as
following:
    
	:::python
    class XML_Parser(Abstract_Conf_Parser):
        def load(self):
            print 'load INI Parser'
    
        def unload(self):
            print 'unload INI Parser'

Then, if we try to initialize the `XML_Parser`, we will get following TypeError exception:

    :::python
    >>> xml_parser = Incomplete_XML_Parser()
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
    TypeError: Can't instantiate abstract class Incomplete_XML_Parser with abstract methods parse

the exception also told us that we have a abstract method `parse` in
`Incomplete_XML_Parser`. And by using `abc.ABCMeta`, programmer could make sure
all inherited classes that need to be initialized will follow the protocol of
abstract base class to provide its own implementation to abstract methods.

## Abstract Property

`abc.ABCMeta` also support abstract property, as abstract methods, abstract
property also requires to be overriden with concrete implementation, or else, an
TypeError exception will be raised when initialization.

Let's assume that we want configuration parsers to check passed file name's
extension when `parse` method is invoked. This check will certainly help to
prevent some sort of problem. To do this, we may add a property to store all
supported file extensions in a concrete configuration parser as following:

    #!python
    import abc

    class Abstract_Conf_Parser(object):
        __metaclass__ = abc.ABCMeta
    
        @abc.abstractproperty
        def file_extensions(self):
            return
    
        @file_extensions.setter
        def file_extensions(self, extensions):
            return
        
    class INI_Parser(Abstract_Conf_Parser):
        @property
        def file_extensions(self):
            return self._file_extensions
    
        @file_extensions.setter
        def file_extensions(self, extensions):
            self._file_extensions = extensions
        
    class XML_Parser(Abstract_Conf_Parser):
        @property
        def file_extension(self):
            return ['xml']

Here, I have used the new syntax to specify property setter that is introducted
in Python 2.6. As abstract methods' example, `INI_Parser` is able to be
initialized, but since `XML_Parser` failed to provide a implementation for the
setter method of property `file_extensions`, `TypeError` exception will be
raised when initialize it.

    :::python
    xml_parser = XML_Parser()
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
    TypeError: Can't instantiate abstract class XML_Parser with abstract methods file_extensions

## abc.ABCMeta registry

### How abc.ABCMeta works

After some tests and source code hacking, I found that the magic of abstract
base classes includes following two parts:

* firstly, any class with a class attribute `__abstractmethods__` will be
  considered as an abstract base classes. `__abstractmethods__` should be a
  instance of type `set` which contains all abstract method names.

* When instance is created and initialized, methods in `__abstractmethods__` will
  be checked to see if they have been provided with a concrete implmementation
  in the inherited class. If that is not the case, then an `TypeError` exception
  will be raised. 

The check of The `__abstractmethods__` is not defined in `abc.ABCMeta` but in
`type`, which is the base class for every classes and metaclasses. So what
`abc.ABCMeta` does is just providing the functionality to set
`__abstractmethods__` attribute. After haveing learned this "magic", We may
construct an abstract base class without using `abc.ABCMeta`. As following
example:

    :::python
    >>> class Foo(object):
    ...     def foo(self):
    ...             print 'foo'
    ... 
    >>> Foo.__abstractmethods__ = set(['foo'])
    >>> f = Foo()
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
    TypeError: Can't instantiate abstract class Foo with abstract methods foo

class `Foo` is made to be an abstract base class by explicitly assigned the
`__abstractmethods__` attribute. Then we got a `TypeError` exception when we
tried to initialize this abstract base class.

`abc.ABCMeta` and `abc.abstractmethod` is a more clear and obvious way to do it
with *metaclass* and *property* technology. By using a different metaclass, we
can express that this class is different with other ordinary classes.

`abc.ABCMeta` also provides other features, like overload `issubclass` and
`isinstnace`. But its main work is collect abstract methods into
`__abstractmethods__` attribute as a metaclass. And `abc.abstractmethod` is the
helper to give an convenient way to specify a method to be abstract.

The definition of `abc.abstractmethod` is a decorator with a simple definition
that we can show it here:
    
    :::python
    def abstractmethod(funcobj):
        funcobj.__isabstractmethod__ = True
	return funcobj
	
It is a decorator but does not return a different function as some other
decrators. It just set the `__isabstractmethod__` attribute for the input
argument `funcobj` and return it.

Since `abc.ABCMeta` provides some extra features, the implementation is rather
complex, to better understand the problem and its solution, I will only give a
simplified version of it as `MyABCMeta`:

    #!python
    class MyABCMeta(type):
        def __new__(mcls, name, bases, namespace):
            cls = super(MyABCMeta, mcls).__new__(mcls, name, bases, namespace)

            abstracts = set(name for name, value in namespace.items()
                        if getattr(value, "__isabstractmethod__", False))
 
            cls.__abstractmethods__ = frozenset(abstracts)
   
            return cls

As many other metaclasses, `MyABCMeta` inehrites from `type`. It redefined
`__new__` to revise the process of class creation. In `MyABCMeta.__new__`,
`type.__new__` is called firstly to construct the class.  Then all abstract
methods in the class definition(the ones with attribute `__isabstractmethod__`
set to be True) will be collected into class attribute
`__abstractmethods__`. Finally, this constructed class with
`__abstractmethods__` attribute assigned are returned as the result of `__new__`
method. Then guess what, we're done!  

By using `MyABCMeta` as metaclass, a class will have all of its abstract methods
being collected into `__abstractmethods__` and then will be considered as an
abstract base class.

    :::python
    class Abstract_Something(object):
        __metaclass__ = MyABCMeta

        @abc.abstractmethod	
        def foo(self):
            print 'foo'

    >>> some_instance = Abstract_Something()
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
    TypeError: Can't instantiate abstract class Abstract_Something with abstract methods foo




    
[1]: http://hyde.github.com/ "Hyde"
[2]: http://en.wikipedia.org/wiki/Class_%28computer_programming%29 "wikipedia.abc"


<!-- 
Local Variables:
mode: markdown
End:
-->
