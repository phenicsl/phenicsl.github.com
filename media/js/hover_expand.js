var HoverExpand = new Class({
    Implements: Options,

    options: {
	element: null,
	maximumWidth: null
    },

    initialize: function(options){
	this.setOptions(options);
	this.tween = new Fx.Tween(this.options.element, {
	    duration: 'short',
	    property: 'width'
	});
    },

    getContentWidth: function(element){
	children = element.getChildren();
	var maximum = 0;
	children.each(function(child){
	    var width = child.getSize().x
	    if(maximum < width){
		maximum = width;
	    }
	});
	return maximum;
    },


    troggleHoverExpand: function(element, expandedWidth, originalWidth){
	var self = this
	
	var parent = new Element("div").wraps(element)
	parent.setStyle('height', element.getSize().y);

	var position = element.getStyle('position');

	if(self.maximumWidth && expandedWidth > self.maximumWidth){
	    expandedWidth = self.maximumWidth;
	}

	element.addEvents({
	    mouseenter: function(){
		element.setStyle('position', 'absolute');
		self.tween.start(expandedWidth);
	    },

	    mouseleave: function(){
		self.tween.start(originalWidth);
		element.setStyle('position', position);
	    }
	});
    },
    
    registerExpand: function(){
	var self = this;
	var element = self.options.element;

	var contentWidth = self.getContentWidth(element);
	var blockWidth = element.getStyle('width').toInt();

	if(contentWidth > blockWidth){
	    self.troggleHoverExpand(self.options.element, contentWidth, blockWidth);
	}
    }
});