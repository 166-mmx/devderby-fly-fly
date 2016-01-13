/* code is terrible - I didn't have time to clean it up ...  */
function setPoint(dest, element) {
	if (plane.tip) {
		$('#tip').fadeOut();
		plane.tip = false;
	}
	var svg = $('#map').svg('get');
	var data = airportData[$(element).data('number')];
	plane.flyTo(data);
	
	var url = (document.location.href.search(/dest/ig)!=-1)?dest+'.html':'dest/'+dest+'.html';
	var obj = {dest: dest, id: iterator(), code: dest};
	history.pushState(obj, '', url);
	historyStack.push(obj);
	render();
}


window.addEventListener('popstate', function(e) {
	// check direction of moving
	if ((historyStack.sites.length == 0) && (historyStack.clearedSites.length == 0)) return false;
	if (historyStack.clearedSites.length!=0 && e.state && e.state.id == historyStack.clearedSites[0].id) {
		// forward
		historyStack.forward();
		if (historyStack.sites.length == 1) {
			plane.moveTo(airportData[historyStack.getLast().code]);
		} else {
			plane.flyTo(airportData[historyStack.getLast().code]);
		}
	} else {
		// back
		
		var i = historyStack.pop();
		if (historyStack.sites.length == 0) {
			$('#tip').fadeIn();
			plane.tip = true;
		} else {
			plane.backTo(airportData[historyStack.getLast().code]);
		}
	}
	
	render();
}, false);

var plane = {
	svg: null,
	element: null,
	nyanImage: null,
	planeModel: null,
	planeFx: null,
	planeRotate: null,
	nyan: false,
	queue: [],
	running: false,
	downloadedMap: false,
	choice: false,
	
	init: function() {
		this.svg = $('#map').svg('get');
		this.nyanImage = this.svg.image(-3100,-3100,28.5,20, 'nyan.gif', {transform:'translate(-10,-14)'});
		
		var path = this.svg.createPath();
		//var path = svg.createPath(); 
		/*this.svg.path( path.move(50, 90).curveC(0, 90, 0, 30, 50, 30). 
		    line(150, 30).curveC(200, 30, 200, 90, 150, 90).close(),  
		    {fill: 'none', stroke: '#D90000', strokeWidth: 10});*/
		this.planeModel = this.svg.group({transform:'translate(-3100, -3100)'});  
		this.planeFx = this.svg.group(this.planeModel, {transform: 'scale(0.3 0.3)'});
		this.planeRotate = this.svg.group(this.planeFx);
		this.svg.polygon(this.planeRotate, [[50,23], [0, 47], [0,60], [50, 53]], {fill: '#f0f0f0', stroke: '#224499', strokeWidth: 1});
		this.svg.polygon(this.planeRotate, [[50,23], [100, 47], [100,60], [50, 53]], {fill: '#f0f0f0', stroke: '#224499', strokeWidth: 1});
		
		this.svg.polygon(this.planeRotate, [[50,73], [25, 92], [25,99], [50, 93]], {fill: '#f0f0f0', stroke: '#224499', strokeWidth: 1});
		this.svg.polygon(this.planeRotate, [[50,73], [75, 92], [75,99], [50, 93]], {fill: '#f0f0f0', stroke: '#224499', strokeWidth: 1});
		
		this.svg.path(this.planeRotate, path.move(50,0).curveC(40,0,43,100,50,100).curveC(57,100,60,0,50,0).close(), {fill: '#fff', stroke: '#224499', strokeWidth: 1}); 
		this.svg.path(this.planeRotate, path.move(50,70).curveC(50,87,45,80,50,93).curveC(55,80,50,87,50,70).close(), {fill: '#fff', stroke: '#224499', strokeWidth: 1});
		
		this.svg.path(this.planeRotate, path.move(47,12).curveC(47,5,53,5,53,12).curveC(53,5,47,5,47,12).close(), {fill: '#fff', stroke: '#224499', strokeWidth: 1});
	
		if (this.nyan) {
			this.element = this.nyanImage;
			$(this.planeFx).hide();
		} else {
			this.element = this.planeModel;
			$(this.nyanImage).hide();
		}
			/*this.svg.circle(0, 0, 7,  
	            {fill: '#000', stroke: 'blue', strokeWidth: 1});*/
	},
	_setNyan: function() {
		
	},
	moveTo: function(data) {
		//console.log('moveTo', this.element);
		//if (this.nyan) {
			this.svg.change(this.element, {x: data.x ,y: data.y});
		//}
		if (!this.nyan) {
			this.svg.change(this.element, {transform: 'translate('+(data.x-15)+','+ (data.y-15)+')'});
		}
		//console.log('PO', this.element);
	},
	runQueue: function() {
		if (this.running || this.queue.length == 0) {
			if ((this.queue.length == 0) && (historyStack.sites.length == 0)) {
				$(this.element).attr('x', -3000).attr('y', -3000);
				if (!this.nyan)
					$(this.element).attr('transform', 'translate(-3000,-3000)');
			}
			return;
		}
		this.running = true;
		var element = this.queue.shift();
		if (element.type == 'FLY') {
			this._flyTo(element.data);
		}
		if (element.type == 'BACK') {
			this._backTo(element.data);
		}
	},
	
	flyTo:function(data) {
		if (historyStack.sites.length == 0) {
			this.moveTo(data);
		} else {
			this.queue.push({type: 'FLY', data: data});
			this.runQueue();
		}
	},
	
	_flyTo: function(data) {
			var self = this;
			
			if (this.nyan) {
				var x = Math.abs($(this.element).attr('x'));
				var y = parseInt($(this.element).attr('y'));
				var distance = Math.sqrt(Math.pow(data.x-x,2) + Math.pow(data.y-y,2));
				var length = distance;
				distance *= 5;
				//console.log(plane);
				if (distance<300)
					distance = 300;
				
				var line = [];
				
				var colors = ['rgb(255,0,0)','rgb(255,153,0)', 'rgb(255,255,0)', 'rgb(51,255,0)', 'rgb(0,153,255)', 'rgb(102,51,255)'];
				var direction = (data.x-x >= 0)?1:-1;
				
				if (direction == 1) {
					colors.reverse();
					this.svg.change(this.nyanImage, {transform: 'translate(-14, -10)'});
					//('x', $(this.element).attr('x'), $(this.element).attr('x')<0);
					if ($(this.element).attr('x')<0)
						this.svg.change(this.nyanImage, {x: x});
					//console.log('x', $(this.element).attr('x'));
				} else {
					this.svg.change(this.nyanImage, {transform: 'translate(14, -10) scale(-1,1)'});
					if ($(this.element).attr('x')>0)
						this.svg.change(this.nyanImage, {x: -x});
				}
				
				var pureDeg = Math.asin((data.y-y) / length) * 180 / Math.PI;
				var deg = direction * pureDeg + ((direction==1)?(-90):90);
				
				var group = this.svg.group($('#lines'), {transform: 'rotate('+deg+','+x+','+y+')'});
				//this.svg.change(this.nyanImage, {transform: $(this.element).attr('transform')+' rotate('+pureDeg+','+x+','+y+')'});
				
				for (var i in colors) {
					var x = parseInt(x)+i*0.375, y = parseInt($(this.element).attr('y')); 
					line.push(this.svg.line(group, x, y, x, y, 
						{stroke: colors[i], strokeWidth: 5.25-(i*0.75)}));
					$(line).animate({svgY2: y+length}, {duration: distance, queue:false});
				}
				
				
				
				//console.log($(this.element).attr('x'), $(this.element).attr('y'), data.x, data.y)
				
				$(this.element).animate({svgX: (data.x)*direction, svgY: data.y}, {duration: distance, complete: function() {
					self.running = false;
					self.runQueue();
				}});
				
			} else {
				var x = Math.abs($(this.element).attr('x'));
				var y = parseInt($(this.element).attr('y'));
				var distance = Math.sqrt(Math.pow(data.x-x,2) + Math.pow(data.y-y,2));
				var length = distance;
				distance *= 5;
				//console.log(plane);
				if (distance<300)
					distance = 300;
				
				var line = [];
				
				var colors = ['#003366','white'];
				var direction = (data.x-x >= 0)?1:-1;
				
				var pureDeg = Math.asin((data.y-y) / length) * 180 / Math.PI;
				var deg = direction * pureDeg + ((direction==1)?(-90):90);
				
				this.svg.change(this.planeRotate, {transform: 'rotate('+(deg-180)+',50,50)'});
				
				var group = this.svg.group($('#lines'), {transform: 'rotate('+deg+','+x+','+y+')'});
				//this.svg.change(this.nyanImage, {transform: $(this.element).attr('transform')+' rotate('+pureDeg+','+x+','+y+')'});
				
				for (var i in colors) {
					//var y = parseInt($(this.element).attr('y')); 
					line.push(this.svg.line(group, x, y, x, y, 
						{stroke: colors[i], strokeWidth: 6-(i*3)}));
					$(line).animate({svgY2: y+length}, {duration: distance, queue:false});
				}
				
				$(this.element).animate({svgTransform: 'translate('+(data.x-15)+','+ (data.y-15)+')'}, {duration: distance, complete: function() {
					self.running = false;
					self.runQueue();
					
				}});
				$(this.element).attr('x', data.x).attr('y', data.y);
			}
			
		
	},
	backTo: function(data) {
		this.queue.push({type: 'BACK', data: data});
		this.runQueue();
	},
	_backTo: function (data) {
		var self = this;
		if (this.nyan) {
			var x = Math.abs($(this.element).attr('x'));
			var y = parseInt($(this.element).attr('y'));
			var distance = Math.sqrt(Math.pow(data.x-x,2) + Math.pow(data.y-y,2));
			var length = distance;
			distance *= 5;
			//console.log(plane);
			if (distance<300)
				distance = 300;
			
			var line = [];
			
			var direction = (data.x-x >= 0)?1:-1;
			
			if (direction == 1) {
				this.svg.change(this.nyanImage, {transform: 'translate(-14, -10)'});
				if ($(this.element).attr('x')<0)
					this.svg.change(this.nyanImage, {x: x});

			} else {
				this.svg.change(this.nyanImage, {transform: 'translate(14, -10) scale(-1,1)'});
				if ($(this.element).attr('x')>0)
					this.svg.change(this.nyanImage, {x: -x});
			}
			
			var lines = $('#lines g').last().find('line');
			var y1 = lines.eq(0).attr('y1');
			lines.each(function() {
				//console.log(this, y1);
				$(this).animate({svgY2: y1}, {duration: distance, queue: false});
			});			
			
			//console.log($(this.element).attr('x'), $(this.element).attr('y'), data.x, data.y)
			
			$(this.element).animate({svgX: (data.x)*direction, svgY: data.y}, {duration: distance, queue:false, complete: function() {
				$('#lines g').last().remove();
				self.running = false;
				self.runQueue();
			}});
			
		} else {
			//console.log(data);
			var x = Math.abs($(this.element).attr('x'));
			var y = parseInt($(this.element).attr('y'));
			
			var distance = Math.sqrt(Math.pow(data.x-x,2) + Math.pow(data.y-y,2));
			var length = distance;
			distance *= 5;
			//console.log(plane);
			if (distance<300)
				distance = 300;
			
			var line = [];
			
			var direction = (data.x-x >= 0)?1:-1;
			var pureDeg = Math.asin((data.y-y) / length) * 180 / Math.PI;
			var deg = direction * pureDeg + ((direction==1)?(-90):90);
			
			this.svg.change(this.planeRotate, {transform: 'rotate('+(deg+180)+',50,50)'});
			
			var lines = $('#lines g').last().find('line');
			var y1 = lines.eq(0).attr('y1');
			lines.each(function() {
				//console.log(this, y1);
				$(this).animate({svgY2: y1}, {duration: distance, queue: false});
			});			
			
			//console.log($(this.element).attr('x'), $(this.element).attr('y'), data.x, data.y)
			
			$(this.element).animate({svgTransform: 'translate('+ (data.x-15)+','+(data.y-15)+')'}, {duration: distance, queue:false, complete: function() {
				$('#lines g').last().remove();
				self.running = false;
				self.runQueue();
			}});
			$(this.element).attr('x', data.x).attr('y', data.y);
		}
	}
}


var historyStack = {
	sites: [],
	clearedSites: [],
	push: function(obj) {
		if (typeof airportData[obj.code] == 'undefined' || ((this.sites.length>0) && (obj.code == this.sites[this.sites.length-1].code))) return false;
		this.sites.push(obj);
		if (this.clearedSites.length > 0)
			this.clearedSites = [];
	},
	pop: function() {
		var element = this.sites.pop();
		this.clearedSites.unshift(element);
		return element;
	},
	forward: function() {
		var element = this.clearedSites.shift();
		this.sites.push(element);
		return element;
	},
	getLast: function() {
		return this.sites[this.sites.length-1];
	}
};

function toggleDetails(obj, code) {
	var next = $(obj).next('.desc'); 
	if (next.length>0) {
		if (next.is(':visible')) {
			$(obj).animate({backgroundColor:'rgba(255,255,255,0);'}, {complete: function() {$(obj).removeAttr('style')} });
		} else {
			$(obj).animate({backgroundColor:'rgba(255,255,255,0.2);'});
		}
		next.slideToggle();
		
	} else {
		var text = '';
		if (airportData[code].author) {
			text += '<img src="../images/'+code.toUpperCase()+'.jpg" style="width:250px" /><br/>';
			text += '<a href="'+airportData[code].link+'" onclick="window.open(this.href);return false;">Author: '+airportData[code].author+'</a>';
		}
		$(obj).after('<div class="desc">'+text+airportData[code].desc+'</div>');
		$(obj).next('.desc').slideDown();
		$(obj).animate({backgroundColor:'rgba(255,255,255,0.2);'});
	}
}

function render() {
	if ($('#history .desc:visible').not(':animated').length>0) {
		$('#history .desc').slideUp(300, render);
		return;
	}
	var l = historyStack.sites.length;
	var html = '<h3>History of visited cities:</h3>';
	for (var i=0;i<l;i++)
		html+='<div onclick="toggleDetails(this, \''+historyStack.sites[i].code+'\')">'+airportData[historyStack.sites[i].code].city+'<span>+</span></div>';
	
	l = historyStack.clearedSites.length;
	for (i=0;i<l;i++)
		html+='<div class="deleted">'+airportData[historyStack.clearedSites[i].code].city+'<span>+</span></div>';
		
	document.getElementById('history').innerHTML = html;
}

function iterator() {
	return ++iterator.i;
}

iterator.i = 0;

function drawIntro(svg) {
	svg.group(null, 'lines');
	var group = svg.group(null, 'elements');

	plane.init();	
	
	var circle;
	for (var i in airportData) {
		if (airportData[i].x) {
			circle = svg.circle(group, airportData[i].x, airportData[i].y, 3,  
		             {fill: 'lime', stroke: 'blue', strokeWidth: 0.3, id:i});
			var z = i;
			$circle = $(circle);
			$circle.data('number', i);
			$circle.hover(function() {
				var pos = $(this).position();
				var data = $(this).data('number');
				if (plane.nyan) {
					data = airportData[data].city;
				} else {
					data = airportData[data].name + ' ('+data+')';
				}
				$('#tooltip').css('top', (pos.top)+'px').css('left', (pos.left+30)+'px').html(data).animate({'opacity':1}, {duration: 300, queue: false});
				
				$(group).append(this);
				$(this).animate({svgR: 6},{duration:300, queue:false});
			}, function() {
				$('#tooltip').animate({'opacity':0}, {duration: 300, queue: false,complete: function() {
					$(this).css({top:'-3100px', left:'-3100px'});
				}});
				
				$(this).animate({svgR: 3},{duration:300, queue:false});
			});
			$circle.click(function() {
				var data = $(this).data('number');
				setPoint(data, this);
			})
		}
	}
	var regexp = /startBase=(.*);*/ig;
	if (document.cookie.match(regexp)) {
		var result = regexp.exec(document.cookie)[1];
		setPoint(result, $('#'+result)[0]);
		document.cookie = 'startBase=0; expires=Fri, 27 Jul 2001 02:47:11 UTC; path=/';
	} else {
		$('#tip').fadeIn();
		plane.tip = true;
	}
}

function downloadedMap() {
	plane.downloadedMap = true;
	$('#loading').remove();
	tryRender();
}

function tryRender() {
	if (plane.downloadedMap && plane.choice)
		drawIntro($('#map').svg('get'));
}

$(document).ready(function() {
	//return;
	$('#map').svg();
	var svg = $('#map').svg('get');
	svg.load('world.svg', {onLoad: downloadedMap, changeSize:false});
	
});

$('#map').resize(function() {
	var svg = $('#map').svg('get');
});

function setNyanBg() {
	
	var $map = $('#map');
	var pos = $map.position();
	var width = parseInt($map.width())+120;
	var height = parseInt($map.height());
	$('#map-bg-container').css({
		top: pos.top,
		left: 0,
		width: width,
		height: height
	});
	var count = Math.ceil(height/60);
	var html = '';
	for (var i=0; i<count;i++) {
		html += '<div class="map-bg map-bg-'+((i%6)+1)+'" style="background-position: '+Math.round(Math.random()*150)+'px 0px"></div>';
	}
	$('#map-bg-container').html(html);
}

function setBg() {
	var $map = $('#map');
	var pos = $map.position();
	var width = parseInt($map.width())+120;
	var height = parseInt($map.height());
	$('#map-bg-container').css({
		top: pos.top,
		left: 0,
		width: width,
		height: height
	});
	$('#map-bg-container').html('');
}

function setupNyan() {
	$('#layer, #dialog').fadeOut();
	setNyanBg();
	$('html').attr('class', 'nyan');
	plane.choice = true;
	plane.nyan = true;
	tryRender()
	//plane.migrate2Nyan();	
}

function setupPlane() {
	$('#layer, #dialog').fadeOut();
	setBg();
	$('html').attr('class', 'plane');
	plane.choice = true;
	plane.nyan = false
	tryRender()
	//plane.migrate2Plane();
}