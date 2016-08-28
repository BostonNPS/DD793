//list extra images to cache, such as placeholders for uncached pictures, animated loaders, etc.
var customImageCache = ["images/default.gif","images/imagePlaceholder.jpg"];

var firstMapLoad = true; //just used to keep map unanimated at initial load.
var currentThread = '';
var currentStop = '';
var loadingProgress = {
	map:false,
	menu:false,
	menuImages:false,
	imagesToCache:new Array()
}

//objects for audio, transcriptions, and what not.

//audioClips abstracts all the separate audio clip objects and audio tags in the DOM as one
//cohesive object with methods that control playing only one clip at a time.
//
//Properties:
//varName: name of the variable you assigned. This is for onclicks in the child audioClip objects.
//clips: Object containing every audioClip. ID of audio tag is key, value is the audioClip object.
//currentClip: ID of current audioClip. NULL if none active.
//paused: play state boolean.
//
//Methods:
//addClip: add an audioClip object. Arguments: DOM id, title of clip, source url, transcription. all should come from config JSON
//allStop: Halt playing; revert all tracks to beginning. Arguments: None.
//playClip: Play clip with given audio DOM id. Pauses any active clip. Arguments: ID of audio to play.
//pause: Pause audio of current clip.
var audioClips = new audioClips("audioClips");
function audioClips(varName) {
	this.varName=varName
	this.clips = {};
	this.currentClip = '';
	this.playing = false;
	this.addClip = function (id, title, src, transcript) {
		this.clips[id] = new audioClip(id, title, src, transcript,this.varName)
	}
	this.allStop = function() {
		for(var id in this.clips) {
			if(this.clips.hasOwnProperty(id)) {
				this.clips[id].stop();
			}
		}
		this.currentClip = '';
		this.playing = false;
		
	}
	this.playClip = function(clipID){
		if(this.currentClip == clipID)//if user is pausing/replaying same clip, just toggle like normal.
		{
			if(this.clips[this.currentClip].togglePlay())
			{
				this.playing = true;
			}
			else
			{
				this.playing = false;
			}
		}
		else
		{
			for(var id in this.clips) {
				if(this.clips.hasOwnProperty(id))
				{
					if(this.clips[id].id == clipID)
					{
						this.clips[id].play();
						this.playing = true;
						this.currentClip = id;
					}
					else
					{
						this.clips[id].stop();
						this.playing = false;
					}
				}
			}
		}
	};
	this.pause = function() {
		this.clips[this.currentClip].stop();
		this.playing = false;
		
	};
}
function audioClip (id, title, src, transcript,parentObjectName) {
	this.id = id;
	this.title = title;
	this.src = src;
	this.transcript = transcript;
	this.audioDOM = '';
	this.controlDOM = '';
	this.transcriptDOM = '';
	this.maxTxtHeight = function ()
	{
		//need to autodetect what the highest element will be when displaying each transcription
		var txtsegments = $(this.transcriptDOM).children();
		var maxheight = 0;
		for(var x = 0; x < txtsegments.length; x++)
		{
			if($(txtsegments[x]).height() > maxheight)
			{
				maxheight = $(txtsegments[x]).height();
				console.log($(txtsegments[x]).height());
			}
		}
		return maxheight;
	}
	this.attachedToDOM = false;
	this.setDomProperties = function () {
		if($("#" + this.id)[0])
		{
			this.audioDOM = $("#" + this.id)[0];
			this.controlDOM = $("#control_" + this.id)[0];
			this.transcriptDOM = $("#transcript_" + this.id)[0];
			this.attachedToDOM = true;
		}
		else
		{
			this.attachedToDOM = false;
		}
	}
	this.getAudioPlayerHTML = function () {
				//first build the html text
				var playerHTML = '<div class="audioPlayer"><audio id="' + this.id +'" preload="metadata"><source src="' + this.src + '"type="audio/mpeg"></audio>';
					playerHTML +=	'<div>'+ this.title+'</div>';
					playerHTML += '<div style="height:3em;">';
						playerHTML +=	'<div class="Control Play" id="control_' + this.id + '" onclick="' + parentObjectName + '.playClip(&quot;' + id +'&quot;);"></div>';
						playerHTML +=	'<div class="ProgressBar"><input id="slider_' + this.id + '" type="range" data-highlight="true" min="0" max="100" step=".01"></div>';
						playerHTML +=	'<div class="Duration" id="duration_' + this.id + '"></div>';
					playerHTML += '</div>';
					playerHTML += '<div id="transcript_' + this.id + '" class="transcriptArea">' + this.transcript + '</div>';
				playerHTML +=	'</div>';
				return playerHTML;
			};
	this.togglePlay = function() { //will also return true if playing.
		if(!this.attachedToDOM)
		{
			this.setDomProperties();
		}
		if(this.attachedToDOM)
		{
			if(this.audioDOM.paused)
			{
				this.audioDOM.play();
				$(this.controlDOM).removeClass("Play");
				$(this.controlDOM).addClass("Pause");
				$(this.transcriptDOM).addClass("active");
				$(this.transcriptDOM).height(this.maxTxtHeight() + "px");
				
				return true;
			}
			else
			{
				if(!this.audioDOM.paused)
				{
					this.audioDOM.pause();
					$(this.controlDOM).removeClass("Pause");
					$(this.controlDOM).addClass("Play");
					return false;
				}
			}	
		}
	}
	this.stop = function () {
		if(!this.attachedToDOM)
		{
			this.setDomProperties();
		}
		if(this.attachedToDOM)
		{
			this.audioDOM.pause();
			$(this.controlDOM).removeClass("Pause");
			$(this.controlDOM).addClass("Play");
			$(this.transcriptDOM).removeClass("active");
			$(this.transcriptDOM).height("0px");
		}
	}
	this.play = function () {
		if(!this.attachedToDOM)
		{
			this.setDomProperties();
		}
		if(this.attachedToDOM)
		{
			this.audioDOM.play();
			$(this.controlDOM).removeClass("Play");
			$(this.controlDOM).addClass("Pause");
			$(this.transcriptDOM).addClass("active");
			$(this.transcriptDOM).height(this.maxTxtHeight() + "px");
		}
	}
	this.pause = function() {
		this.audioDOM.pause();
		$(this.controlDOM).removeClass("Pause");
		$(this.controlDOM).addClass("Play");
		$(this.transcriptDOM).removeClass("active");
		$(this.transcriptDOM).height("0px");
	}
}

//map stuff!
var USSCYBounds = [
	[42.37260234690617,-71.05561766169558],
	[42.37153403926178,-71.05307294257727]
	]
var CNYBounds = [
	[42.37768021461408,-71.06264932697059],
	[42.37019737577195,-71.04964284427524]
	]

var center = {
	  "lat": 42.3721211301469,
	  "lng": -71.05435106895129
	}
	
var NPMap;

function initMap() {
	//create config object for NPMap.js
	NPMap = L.npmap.map({
		"baseLayers" : [
			{
				"opacity" : 1,
				"type" : "tiled",
				minZoom : 17,
				maxZoom : 19,
				"url" : "tiles/{z}/{x}/{y}.png",
				"name" : "USS CY App Overlay - Charlestown Navy Yard Level",
				tms : true
			}
		],
		"center" : center,
		"div" : "map",
		"homeControl" : false,
		"maxBounds" : CNYBounds,
		"maxZoom" : 20,
		"minZoom" : 17,
		"overlays" : [{
				"opacity" : 1,
				"type" : "tiled",
				minZoom : 19,
				maxZoom : 20,
				"url" : "tiles/{z}/{x}/{y}.png",
				"name" : "USS CY App Overlay - Cassin Young Main Deck Level",
				tms : true
			},
		],
		"smallzoomControl" : false,
		"zoom" : 18,
	});
	//Set up listeners
	NPMap.on("click", function (e) {
	console.log(e.latlng)
	});
	NPMap.on("zoomend", function (e) {
		if (NPMap.getZoom() == 19) {
			NPMap.panTo(center, {
			animate : true,
			duration : .5
			});
		}
	});
	//Create CSV strings to process a layer for each thread
	for (x in data.threads)
	{
		//data.threads[x].markerObjs = []
		try
		{
			for (y in data.threads[x].stops)
			{
				var stopNum = parseInt(y) + 1;
				//data.threads[x].stops[y].markerObj = L.marker([data.threads[x].stops[y].marker.lat,data.threads[x].stops[y].marker.lng],{icon:L.npmap.icon.maki({'marker-symbol':String(stopNum),'marker-color':data.threads[x].threadColor})}).bindPopup('<div class="mapBubble" onclick="mapMarkerJump(&quot;\#' + data.threads[x].id + '_' + data.threads[x].stops[y].id + '&quot;)">' + data.threads[x].stops[y].title + '</div>');
				data.threads[x].stops[y].markerObj = L.marker([data.threads[x].stops[y].marker.lat,data.threads[x].stops[y].marker.lng],{icon:L.icon({'iconUrl':'pins/pin-m-' + String(stopNum) + '+' + data.threads[x].threadColor + '@2x.png','iconAnchor':[14,36],'iconSize':[30,70],'popupAnchor':[2,-34],'marker-size':'medium'})}).bindPopup('<div class="mapBubble" onclick="mapMarkerJump(&quot;\#' + data.threads[x].id + '_' + data.threads[x].stops[y].id + '&quot;)">' + data.threads[x].stops[y].title + '</div>');
				//NPMap.addLayer(data.threads[x].stops[y].markerObj);
			}
		}
		catch(err)
		{
			console.log("Incomplete map data for thread " + data.threads[x].id)
			console.log(err)
		}
	}
	loadingProgress.map = true;
	startApp();
}

//Depricated Google map stuff....
/*
var map;
var markers;
var infowindows;
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 42.372219, lng: -71.054484},
		zoom: 20,
		streetViewControl: false,
		mapTypeControlOptions: {
      mapTypeIds: ['CNY']
    }
  });
    var imageBounds = {
    north: 42.37255,
    south: 42.371575,
    east: -71.05385,
    west: -71.054975
  };
  USSCYoverlay = new google.maps.GroundOverlay('3dmap.png',imageBounds);
	USSCYoverlay.setMap(map);
  var CNYMAP = new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
        //var bound = Math.pow(2, zoom);
        return 'tiles' +
            '/' + zoom + '/' + coord.x + '/' +
            coord.y + '.png';
    },
    tileSize: new google.maps.Size(256, 256),
    maxZoom: 20,
    minZoom: 17,
    radius: 1738000,
    name: 'CNY'
  });

  map.mapTypes.set('CNY', CNYMAP);
  map.setMapTypeId('CNY');
  
  google.maps.event.addListener(map,'zoom_changed', function(){
	  if(map.getZoom() == 20)
	  {
		  USSCYoverlay.setMap(map);
		  
	  }
	  else
	  {
		  USSCYoverlay.setMap(null);
	  }
  });
  {
	  
  }
  //USSCYoverlay.setMap(map);
  
  //testing map maker latlng console logger
  google.maps.event.addListener(map,'click', function(e) {
    console.log(e.latLng.toString());
  });
 
	//MAKE MAP MARKERS
	markers = new Array(data.threads.length);
	infowindows = new Array(data.threads.length);
	for (x in data.threads){
		markers[x] = new Array(data.threads[x].stops.length);
		infowindows[x] = new Array(data.threads[x].stops.length);
		for(y in data.threads[x].stops){
			if(data.threads[x].stops[y].marker){
				var marker = new google.maps.Marker({
					position: data.threads[x].stops[y].marker,
					map: null,
					icon: getMarker(data.threads[x].threadColor)
				});
				postInfoWindow(marker, x, y)
			}
		}
	}
	
	//thread selection dropdown
	var threadSelectDiv = document.createElement('div');
	var selectDivStr = "<select onchange='selectThread(this.value,0)' id='threadSelectViaMap'>";
	for (x in data.threads)
	{
		selectDivStr += "<option value='" + x + "'>" + data.threads[x].title + "</option>";
	}
	selectDivStr += "</select>"
	$(threadSelectDiv).append(selectDivStr);
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(threadSelectDiv);
	
	loadingProgress.map = true;
	startApp();
}

function postInfoWindow(marker, threaditer, stopiter) {
	var contentString = "<span class='mapBubble' onclick='mapMarkerJump(\"#" + data.threads[threaditer].id + '_' + data.threads[threaditer].stops[stopiter].id + "\")'>Stop " + (parseInt(stopiter) + 1) + ": " + data.threads[threaditer].stops[stopiter].title + "</span>";
	var infowindow = new google.maps.InfoWindow({
		content: contentString
	});
	markers[threaditer][stopiter] = marker;
	infowindows[threaditer][stopiter] = infowindow;
	marker.addListener('click', function(e) {
		
		for(x in infowindows){
			for(y in infowindows[x]){
				infowindows[x][y].close();
			}
			
		}
		infowindow.open(map, marker);
		//map.panTo(e.latLng);
  });
	
}
*/
function selectThread(threaditer,stopiter) {
	//iterate through correct array of markers and spit them out to map.

	for (x in data.threads)
	{
		for (y in data.threads[x].stops)
		{
			try {
				if(x == threaditer)
				{
						NPMap.addLayer(data.threads[x].stops[y].markerObj);
						if(y == stopiter)
						{
							data.threads[x].stops[y].markerObj.openPopup();
						}
				}
				else
				{
						NPMap.removeLayer(data.threads[x].stops[y].markerObj);
				}
			}
			catch(err){}
		}
	}

	for(x in data.threads[threaditer].stops)
	{
		
	}
}

function mapMarkerJump(href)
{		//if we are on a stop page and user uses the map to go to a different stop, dont change hash but rewrite locationbar url as if user changed. this way back button goes to thread menu.
		$("#shipPanel").removeClass('slideOut');
		$("#shipPanel").addClass('slideIn');
		setTimeout(function (){

  		if($(".ui-page-active").hasClass("stopPage"))
		{
			$("body").pagecontainer("change",href,{changeHash:false});
			window.history.replaceState({},'',href);
		}
		else
		{
			$("body").pagecontainer("change",href,{changeHash:true});			
		}

}, 1000);
}

function animateMap(target){
if(firstMapLoad)
{
	$(target).addClass('slideOut');
	$(target).removeClass('slideIn')
	firstMapLoad = false;
}
else
{
	$(target).toggleClass('slideOut');
	$(target).toggleClass('slideIn');
}

}

//Handler for resetting some defaults of a page when leaving.
$(document).on( "pagecontainerbeforechange", function( event, ui ) {
	divID = $(ui.prevPage).attr("id");

	//close and stop all video popups (they are in root of body)
	$(".videoPopup").each(function(){closeVideo(this.id)});
	
	//Navbar should always "slide" out of screen when changing pages. also kill listener so it won't fire when transition if it was enabled.
	hideNavOnLandscapeScroller('stop');
	$(".navbar").removeClass("navbarin");
	$(".navbar").addClass("navbarout");
	
	//$("#" + divID + " .menuItem").addClass("menuItemHidden");
	$("#" + divID + " .menuItem").removeClass("menuItemDeployed");
	$("#" + divID + " .menuItem").addClass("menuItemFinished");
	$("#" + divID + " .menuItemFinished").removeClass("menuItem");
	
} );

//handler for changing from one page to another.
$(document).on( "pagecontainerchange", function( event, ui ) {
	
	//scroll back to the top of page.
	//$(window).scrollTop(0);
	
	//stop audio just in case user is lazy.
	audioClips.allStop();
	
	//put all the panels back where they belong.
	$("#shipPanel").removeClass('slideOut');
	$("#shipPanel").addClass('slideIn');
	//$(".navbar").removeClass("navbarin");
	//$(".navbar").addClass("navbarout");
	
	//helper vars for old and new div ids (aka ui-pages)
	divID = $(ui.toPage).attr("id");
	OLDdivID = $(ui.prevPage).attr("id");
	
	//dynamically load images if not loaded already
	$("#" + divID + " img").each(function(index, element){
		$(element).attr("src",$(element).data("imgsrc"));
	});
	
	previousThread = currentThread;
	previousStop = currentStop;
	if($("#" + divID).data("threaditer") != 'undefined') //if not the main menu, so a thread or stop page
	{
		currentThread = $("#" + divID).data("threaditer");
	}
	else
	{
		currentThread = '';
	}
	if($("#" + divID).data("stopiter") != 'undefined') //if not main or thread page, so a stop page
	{
		currentStop = $("#" + divID).data("stopiter");
	}
	else
	{
		currentStop = '';
	}
	
	//reset any menu buttons -- moot if on a stop page.

	//August 20 - remove repeated menu animations after first time -- annoying in mobile.

	//$("#" + OLDdivID + " .menuItem").removeClass("menuItemHidden");
	//animate any new menu buttons
	
	$("#" + divID + " .menuItem").addClass("menuItemDeployed");
	
	
	//if this is a stop page, we need to determine the next and previous pages for linking/traversing the thread, etc. Also determine what the navbar is doing.
	if($("#" + divID).hasClass("stopPage"))
	{
		
		$("#MobileTitle").html(data.threads[currentThread].title + ":<br>" + data.threads[currentThread].stops[currentStop].title);
		$("#MobileMenuBtn").css("display","inline-block");
		$("#MobileStartBtn").css("display","none");
		$("#MobileResumeBtn").css("display","none");
		if(currentStop > 0 && currentStop < data.threads[currentThread].stops.length - 1) //if not the first or last stop in thread
		{
			$("#MobilePrevBtn").css("display","inline-block");
			$("#MobilePrevBtn").attr("href","#" + data.threads[currentThread].id + "_" + data.threads[currentThread].stops[currentStop - 1].id);
			$("#MobileNextBtn").css("display","inline-block")
			$("#MobileNextBtn").attr("href","#" + data.threads[currentThread].id + "_" + data.threads[currentThread].stops[currentStop + 1].id)
		}
		else
		{
			if(currentStop == data.threads[currentThread].stops.length - 1) //last stop in thread
			{
				$("#MobileNextBtn").css("display","none");
				$("#MobilePrevBtn").css("display","inline-block");
				$("#MobilePrevBtn").attr("href","#" + data.threads[currentThread].id + "_" + data.threads[currentThread].stops[currentStop - 1].id)
			}
			else
			{
				if(currentStop == 0) //first stop in thread
				{
					$("#MobilePrevBtn").css("display","none");
					$("#MobileNextBtn").css("display","inline-block");
					$("#MobileNextBtn").attr("href","#" + data.threads[currentThread].id + "_" + data.threads[currentThread].stops[currentStop + 1].id)
				}
				
			}
		}
		selectThread(currentThread,currentStop)//select this thread in the map/draw markers
		$("#threadSelectViaMap").val(currentThread);
		if(((window.innerHeight > window.innerWidth) && window.innerWidth < 1080))//portrait and a mobile screen (width below 1080px), let navbar be fixed at the bottom of screen viewport.
		{
			$(".navbar").removeClass("navbarout");
			$(".navbar").addClass("navbarin");
		}
		else 
		{
			if((window.innerHeight < window.innerWidth) && window.innerWidth < 1080)
				//landscape, let it disappear until the picture slideshow is moved up enough
			{
				//$(".navbar").removeClass("navbarin");
				//$(".navbar").addClass("navbarout");
				hideNavOnLandscapeScroller('start');
				//$(".navbar").addClass("navbarin");
			}
			else //on a desktop
			{
				$(".navbar").removeClass("navbarout");
				$(".navbar").addClass("navbarin");
			}
		}
	}
	else
	{
		if($("#" + divID).hasClass("threadPage"))//back to a thread page.
		{
			$("#MobileMenuBtn").css("display","inline-block");
			$("#MobileTitle").html(data.threads[currentThread].title);
			if(previousThread == currentThread)//user only went back to the list of stops in same thread KEEP SAME NAVBAR TITLE.
			{
				selectThread(currentThread,previousStop)
				$("#MobileStartBtn").css("display","none");
				$("#MobilePrevBtn").css("display","none");
				$("#MobileNextBtn").css("display","none");
				$("#MobileResumeBtn").css("display","inline-block");
				$("#MobileResumeBtn").attr("href","#" + data.threads[currentThread].id + "_" + data.threads[currentThread].stops[previousStop].id)
				$("#MobileTitle").html(data.threads[currentThread].title + ":<br>" + data.threads[currentThread].stops[previousStop].title)
			}
			else
			{
				selectThread(currentThread,0);
				$("#threadSelectViaMap").val(currentThread);
				$("#MobilePrevBtn").css("display","none");
				$("#MobileNextBtn").css("display","none");
				$("#MobileResumeBtn").css("display","none");
				$("#MobileStartBtn").css("display","inline-block");
				$("#MobileStartBtn").attr("href","#" + data.threads[currentThread].id + "_" + data.threads[currentThread].stops[0].id)
			}
			$(".navbar").removeClass("navbarout");
			$(".navbar").addClass("navbarin");
		}
		else //this is the main menu page
		{
			$("#MobileMenuBtn").css("display","none");
			$("#MobileStartBtn").css("display","none");
			$("#MobilePrevBtn").css("display","none");
			$("#MobileNextBtn").css("display","none");

				//$("#mainMenuNavbar").removeClass("navbarout");
				//$("#mainMenuNavbar").addClass("navbarin");

		}
	}
	
	console.log(OLDdivID)
	
	
	//reset slideshow animation and position
	var slideNum = $("#" + OLDdivID + " div.slider").attr("data-slides");
	$("#" + OLDdivID + " div.slider").css("transform","translateX(" + (-100/slideNum) +"%)");
	$("#" + OLDdivID + " div.slider").attr("data-currentslide","1");
	setTimeout(function(){progressSlide($("#" + divID + " div.slider"),-1)},1000);
	//slideshow animation on load
	/*
	$("#" + divID + " div.slider").css("transform","translateX(0%)");
	$("#" + divID + " div.slider").attr("data-currentslide","0");
	$("#" + divID + " .slide-dots li").removeClass("active");
	$("#" + divID + " .slide-dots li:first-child").addClass("active");
*/
	
	reJiggerSlideshow();
} );
/*
function toggleNavBar()
{
		if($('#MobileNavbar').hasClass('navbarin'))
		{
			$('#MobileNavbar').removeClass('navbarin');
			$('#MobileNavbar').addClass('navbarout');
			$('#navbarToggler').removeClass('navToggleslideIn');
			$('#navbarToggler').addClass('navToggleslideOut');
		}
		else
		{
			$('#MobileNavbar').addClass('navbarin');
			$('#MobileNavbar').removeClass('navbarout');
			$('#navbarToggler').addClass('navToggleslideIn');
			$('#navbarToggler').removeClass('navToggleslideOut');
		}
}
*/

function hideNavOnLandscapeScroller(state) {
	if(state == 'start')
	{
				
				$(window).scroll(function(){
				//console.log($("body").scrollTop() + " + " + window.innerHeight +  "    " + $(".ui-page-active .slideshow").height())
				if($("body").scrollTop() + window.innerHeight > $(".ui-page-active .slideshow").height() + $("#MobileNavbar").height())
				{
					$(".navbar").addClass("navbarin");
					$(".navbar").removeClass("navbarout");
				}
				else
				{
				if($("body").scrollTop() + window.innerHeight < $(".ui-page-active .slideshow").height() + $("#MobileNavbar").height())
				{
							$(".navbar").removeClass("navbarin");
							$(".navbar").addClass("navbarout");
				}
				}
				
			});
	}
	else
	{
		$(window).unbind('scroll');
	}
	
	
}

function cacheLoaded(img) {
	var $img = $(img);
	$img.addClass("loaded");
	
	var loaded = $("#imageCache").find('.loaded').length;
	if(loaded/loadingProgress.imagesToCache.length >= .98)
	{
		loadingProgress.menuImage = true;
		startApp();
	}
	$("#loaderStatus").html("Loading... " + parseInt(loaded/loadingProgress.imagesToCache.length *100) +"%");
}

function startApp() {
	if(loadingProgress.menuImage && loadingProgress.menu && loadingProgress.map)
	{
			console.log("images and stuff loaded...")
	}
}

$(document).ready(function(){
	$("#loaderScreen").addClass("fadeinloader");
	$("#loaderStatus").html("Loading... 0%");
	//load map using bootstrap method 
	initMap();
	//calculate total number of images to cache
	for(custom in customImageCache)
	{
		loadingProgress.imagesToCache.push(customImageCache[custom]);
	}
	for(x in data.threads) {
		loadingProgress.imagesToCache.push(data.threads[x].menuImage);
		for(y in data.threads[x].stops)
		{
			loadingProgress.imagesToCache.push(data.threads[x].stops[y].menuImage);
			try
			{
				//loadingProgress.imagesToCache.push(data.threads[x].stops[y].images[0].src);
				loadingProgress.imagesToCache.push(data.threads[x].stops[y].images[1].src);
			}
			catch (err)
			{
				console.log("missing a minimum of two images for stop " + data.threads[x].id + "_ " + data.threads[x].stops[y].id);
				console.log(err)
			}
		}
		
	}
	for(images in loadingProgress.imagesToCache)
	{
		$("#imageCache").append("<img src='" + loadingProgress.imagesToCache[images] + "' onload='cacheLoaded(this)'>");
	}
	reJiggerSlideshow();
	//IF there is a click on any pages and all their children, close the map pane.
	$(".infoPage").on("click","*",function(){
		if(!firstMapLoad)
		{
			$("#shipPanel").removeClass('slideOut');
			$("#shipPanel").addClass('slideIn');
		}
	});
	
	//set slideshow swipe left right and click left right listeners
	$("div.slideshow").on("swiperight",function(event){
		var slider = $(this).find(".slider");
		progressSlide(slider, -1);
		
	});
		$("div.leftSlideScroll").on("click", function(){
		var slider = $(this).parent().find(".slider");
		progressSlide(slider, -1);
	});
	$("div.slideshow").on("swipeleft",function(event){
		var slider = $(this).find(".slider");
		progressSlide(slider, 1);
	});
	$("div.rightSlideScroll").on("click", function(){
		var slider = $(this).parent().find(".slider");
		progressSlide(slider, 1);
	});
	
	//audio stuff
	//universal listener for slider movement
	$(document).on( "slidestart", function(event) {
		var audioID = new String(event.target.id).split("slider_")[1];
		if(audioClips.currentClip != audioID)
		{
			audioClips.allStop(); //stop audio if user is panning through a different track
		}
		else
		{
			audioClips.pause();
		}
	}).on("slidestop", function(event){
		var audioID = new String(event.target.id).split("slider_")[1];
		var requestedTime = event.target.value/100;
		
		audioTag = audioClips.clips[audioID].audioDOM;
		newTime = new String(parseInt(audioTag.duration * requestedTime));
		audioTag.currentTime = newTime;
		
		if(audioClips.currentClip == audioID)
		{
			audioClips.playClip(audioID);
		}
		//console.log(audioTag.currentTime + " " + newTime)
		//toggleAudioPlayback(audioID,"play");
	});
	
	//individual audio data setup stuff
	$("audio").each(function(){
		var sliderElem = "slider_" + this.id;
		var transcriptElem = "transcript_" + this.id;
		var audioElem = document.getElementById(this.id);
		
		//set duration data once data is loaded.
		audioElem.addEventListener('loadedmetadata', function() {
			var durationMin = parseInt(audioElem.duration/60);
			var durationSec = parseInt(audioElem.duration - (durationMin * 60));
			if(durationSec < 10)
			{
				durationSec = "0" + durationSec;
			}
			$("#duration_" + this.id).html("0:00 / " + durationMin + ":" + durationSec);
		});
		//setup listener to continually update slider and transcript highlighting as audio plays
		audioElem.ontimeupdate =  function(){
			$("#" + sliderElem).val((audioElem.currentTime/audioElem.duration)*100).slider( "refresh" );
			transcriptHighlight(audioElem.currentTime,transcriptElem);
			var durationMin = parseInt(audioElem.duration/60);
			var durationSec = parseInt(audioElem.duration - (durationMin * 60));
			if(durationSec < 10)
			{
				durationSec = "0" + durationSec;
			}
			var currentMin = parseInt(audioElem.currentTime/60);
			var currentSec = parseInt(audioElem.currentTime - (currentMin * 60));
			if(currentSec < 10)
			{
				currentSec = "0" + currentSec;
			}
			$("#duration_" + this.id).html(currentMin + ":" + currentSec + " / " + durationMin + ":" + durationSec);
			};
		
		
	});
	
	//paragraph preview listener
	$(".menuHeaderTextAccordion").on("click", function(event){
		console.log(event);
		if($(event.currentTarget.parentNode).hasClass("menuHeaderShowText"))
		{
		$(event.currentTarget).find(".menuHeaderTextBtn").addClass("menuHeaderSlideIn");
		$(event.currentTarget).find(".menuHeaderTextBtn").removeClass("menuHeaderSlideOut");
		$(event.currentTarget.parentNode).removeClass("menuHeaderShowText");
		}
		else
		{
		$(event.currentTarget).find(".menuHeaderTextBtn").addClass("menuHeaderSlideOut");
		$(event.currentTarget).find(".menuHeaderTextBtn").removeClass("menuHeaderSlideIn");
		$(event.currentTarget.parentNode).addClass("menuHeaderShowText");
		}
		
	});
	
	//setup video play and pause listener.
	/*
	$( ".videoPopup" ).popup({
	afteropen: function( event, ui ) {
		if($(window).width() < 1025 && $(window).height() < 769)
		{
		//goFS($(".ui-popup-active video")[0]);//active go fullscreen.
		}
		$(".ui-popup-active video")[0].play();//only activate active video.
	},
	afterclose: function( event, ui ) {
		$("video").each(function(){noFS(this)});//default to allstop when popups close.
		$("video").each(function(){this.pause()});//default to allstop when popups close.
	}
	
	});*/
	//set exit fullscreen listener
	
});

//this is the main dynamic content loader!
$(document).on( "pagecontainercreate", function( event, ui ) {
	var mainMenuHTML = '<div class="infoPage" data-role="page" id="mainMenu"><div id="mainMenuNavbar"><img style="height:3.5em; float:left;padding-right:2em;" src="images/ah.png" id="a-head"><span style="font-size:1em;padding-top:.5em;display:inline-block">' + data.title + '<br><span style="font-size:.75em;float:left;">' + data.subtitle + '</span></span></div>';
	mainMenuHTML += '<div class="menuHeader menuItem" style="background-image:url(' + data.menuImage + ');animation-delay:' + (1/6) + 's;"><h3 style="margin-bottom:2em;">' + data.tagLine + '</h3>' + data.introText + '<div class="menuHeaderTextAccordion"><div class="menuHeaderTextBtn"></div></div></div></div>';
	$("body").append(mainMenuHTML);
	for(x in data.threads)
	{
		//for each thread declared, make a button on main menu
		$("#mainMenu").append(addMainMenuItem(data.threads[x],x));
		
		//now declare a page as a jquery mobile div page, complete with subsequent stop buttons
		$("body").append(addThreadPage(data.threads[x],x));
		
		//now iterate through stops and make subsequent pages for each stop
		for(y in data.threads[x].stops)
		{
			var stopPage = createStop(data.threads[x], data.threads[x].stops[y], x, y);
			$("body").append(stopPage);
		}
		
	}
	loadingProgress.menu = true;
	startApp();
});

function addMainMenuItem(threadData,x) {
	if (threadData.stops.length == 0)
	{
		console.log("no stops in" + threadData.title);
		var menuItem = '<div class="menuItem" style="background-image: url(' + threadData.menuImage + ');animation-delay:' + ((x/6)+(1/3)) +'s;color:rgba(211,211,211,.75);font-weight:bold;"><div style="margin-top:6.5em;">' + threadData.title + '</div><div style="font-size:.75em;">' + threadData.subtitle + '</div><img src="images/comingsoon.svg" style="position: relative;top: -9.5em;float: right;"></div>';
	}
	else
	{
		var menuItem = '<a href="#' + threadData.id + '" class="menuItem" style="background-image: url(' + threadData.menuImage + ');animation-delay:' + ((x/6)+(1/3)) +'s;"><div style="margin-top:6.5em;">' + threadData.title + '</div><div style="font-size:.75em;">' + threadData.subtitle + '</div></a>';
	}
	return menuItem;
}

function addThreadPage(threadData,x) {
	var threadPage = '<div class="infoPage threadPage" data-role="page" data-threaditer="' + x + '" id="' + threadData.id +'">';
		//add introText
		threadPage += '<div class="menuHeader menuItem" style="background-image: url(' + threadData.menuImage + ');animation-delay:' + (1/6) + 's;"><h3 style="margin-bottom:2em;">' + threadData.title + '<br>' + threadData.subtitle + '</h3>' + threadData.introText + '<div class="menuHeaderTextAccordion"><div class="menuHeaderTextBtn"></div></div></div>';
	
		//now add each stop for the thread

		for(y in threadData.stops)
		{
			//add button for each stop within tour
			threadPage += '<a href="#' + threadData.id + '_' + threadData.stops[y].id + '" class="menuItem" style="background-image: url(' + threadData.stops[y].menuImage + ');animation-delay:' + ((y/6)+(1/3)) +'s;"><div style="margin-top:6.5em;">' + threadData.stops[y].title + '</div><div style="font-size:.75em;">' + threadData.stops[y].subtitle + '</div></a>';
			//create stop page using helper function
		}
		threadPage += '</div>';
		return threadPage;
}

function createStop(parentObject, stopObject, threaditer, stopiter) {
	var stopPage = '<div class="infoPage stopPage" data-role="page" id="' + parentObject.id + '_' + stopObject.id +'" data-threaditer="' + threaditer +'" data-stopiter="' + stopiter +'">'
		//insert navbar
		//stopPage += '<div class="desktopNavbar navbar stopnavbar"><span style="font-size:1em;padding-top:.5em;display:inline-block">' + parentObject.title + '</span><br><img src="images/icons-svg/carat-r-white.svg" style="width:1em;height:1em;vertical-align:text-bottom;margin-left:.5em"><span style="font-size:1em;margin-left:.5em;">' + stopObject.title + '</span></span><img class="menuButton" src="images/icons-svg/bars-white.svg"></div>';
		
		//Handle image slideshow, etc.
		stopPage += '<div class="slideshow"><div class="sideScrollBtn leftSlideScroll"></div><div class="sideScrollBtn rightSlideScroll"></div><div class="slider" style="width:' + (100 * stopObject.images.length) +'%;transform:translateX(' + (-100/stopObject.images.length) +'%)" data-slides="' + stopObject.images.length +'" data-currentslide="1">'
		for(img in stopObject.images)
		{
			stopPage += '<div class="slideshowSlide">';
			if(stopObject.images[img].video)
			{
				stopPage += '<div class="slideshowSlideCaption"><span>' + stopObject.images[img].caption +'</span></div><div onclick="playVideo(&quot;' + stopObject.id + "_video_" + img + '&quot;)" style="cursor:pointer;"><img src="' + stopObject.images[img].thumbnail + '"></div>';
				$("body").append('<div class="videoPopup" id="' + stopObject.id + "_video_" + img + '"><div class="vidContainer"><video controls preload="metadata"><source src="' + stopObject.images[img].video  +'"></video><div onclick="closeVideo(&quot;'+ stopObject.id + "_video_" + img +'&quot;)" class="ui-btn ui-corner-all ui-shadow ui-btn-a ui-icon-delete ui-btn-icon-notext ui-btn-right">Close</div></div></div>');
				
				//stopPage += '<div class="videoContent" onclick="playVideo(&quot;' + parentObject.id + '_' + stopObject.id + '_' + img + '&quot;)"><video style="display:none;" id="' + parentObject.id + '_' + stopObject.id + '_' + img + '"></div>';
			}
			else
			{
			stopPage += '<div class="slideshowSlideCaption"><span>' + stopObject.images[img].caption +'</span></div><img src="images/default.gif" data-imgsrc="' + stopObject.images[img].src + '" alt="' + stopObject.images[img].altText + '">';
			}
			stopPage += '</div>';
		}
		stopPage += '</div><ul class="slide-dots">'
		for(img in stopObject.images)
		{
			stopPage += '<li></li>'
		}
		stopPage += '</ul></div>';
		
		//now handle text and audio content, etc.
		stopPage += '<div class="contentSpace">'
		stopPage += '<p>' + stopObject.introText + '</p>'
		for(clip in stopObject.audio)
		{
			audioClips.addClip(stopObject.audio[clip].id,stopObject.audio[clip].title,stopObject.audio[clip].src,stopObject.audio[clip].transcript);
			stopPage += audioClips.clips[stopObject.audio[clip].id].getAudioPlayerHTML();
			/*
			stopPage += '<div class="audioPlayer"><audio id="' + stopObject.audio[clip].id +'" preload="metadata"><source src="' + stopObject.audio[clip].src + '" type="audio/mpeg"></audio>';
				stopPage +=	'<div>'+stopObject.audio[clip].title+'</div>';
				stopPage += '<div style="height:3em;">';
					stopPage +=	'<div class="Control Play" id="control_' + stopObject.audio[clip].id + '" onclick="toggleAudioPlayback(&apos;' + stopObject.audio[clip].id + '&apos;);"></div>';
					stopPage +=	'<div class="ProgressBar"><input id="slider_' + stopObject.audio[clip].id + '" type="range" data-highlight="true" min="0" max="100" step=".01"></div>';
					stopPage +=	'<div class="Duration" id="duration_' + stopObject.audio[clip].id + '"></div>';
				stopPage += '</div>';
				stopPage += '<div id="transcript_' + stopObject.audio[clip].id + '" class="transcriptArea">' + stopObject.audio[clip].transcript + '</div>';
			stopPage +=	'</div>';*/
		}
		stopPage += '</div>';
		
	//Closing DIV
	stopPage += '</div>';
return stopPage;
}

function transcriptHighlight(seconds, parent)
{
	$("#" + parent + " span.transcription").each(function(index, element){
		var start = $(element).data("start");
		var end = $(element).data("end");
		//console.log(start +" "+ seconds +" "+ end)
		if((seconds >start) && (seconds < end))
		{
			$(element).addClass("highlightedText");
		}
		else{
			$(element).removeClass("highlightedText")
		}
	});
}

function goFS(domObj) {
if (domObj.requestFullscreen) {
  domObj.requestFullscreen();
} else if (domObj.msRequestFullscreen) {
  domObj.msRequestFullscreen();
} else if (domObj.mozRequestFullScreen) {
  domObj.mozRequestFullScreen();
} else if (domObj.webkitRequestFullscreen) {
  domObj.webkitRequestFullscreen();
}
//$("#" + videoID).addClass("fullScreenVid");
}

function noFS(domObj) {
if (domObj.exitFullscreen) {
  domObj.exitFullscreen();
} else if (domObj.msExitFullscreen) {
  domObj.msExitFullscreen();
} else if (domObj.mozExitFullScreen) {
  domObj.mozExitFullScreen();
} else if (domObj.webkitExitFullscreen) {
  domObj.webkitExitFullscreen();
}
//$("#" + videoID).addClass("fullScreenVid");
}

function playVideo(id) {
	$("#" + id).css("display","block");
	$("#" + id).removeClass("videoOut");
	$("#" + id).addClass("videoIn");
	$("#" + id + " video")[0].play();//automatically play.
}

function closeVideo(id) {
	$("#" + id).removeClass("videoIn");
	$("#" + id).addClass("videoOut");
	$("#" + id + " video")[0].pause();//automatically play.
	setTimeout(function(){$("#" + id).css("display","none");},500)
}


function reJiggerSlideshow() {
	
	$("div.slideshowSlide").attr("style","width:" +$(window).width() +"px !important");
	var activeSlideshow = $(".ui-page-active").find(".slideshow");
	$(".leftSlideScroll").attr("style","top:" + activeSlideshow.height()/2 +"px !important; left:" + activeSlideshow.css('margin-left') +" !important");
	$(".rightSlideScroll").attr("style","top:" + activeSlideshow.height()/2 +"px !important; right:" + activeSlideshow.css('margin-right') +" !important");
}

function progressSlide(slider, x) {
			var currentPos = parseInt($(slider).attr("data-currentslide"));
		var progression = -100/($(slider).attr("data-slides"));
		if(currentPos > 0 && x == -1)//going backward to beginning of slideshow
		{
			$(slider).css("transform","translateX(" + (currentPos - 1)*progression + "%)");
			$(slider).attr("data-currentslide",currentPos - 1);
			$(slider).parent().find('li').removeClass("active");
			console.log(currentPos)
			$(slider).parent().find('li:nth-child(' + (currentPos) + ')').addClass("active");
			
			
		}
		else{
		if((currentPos < $(slider).attr("data-slides")-1) && x == 1) //going forward in slideshow
		{
			$(slider).css("transform","translateX(" + (currentPos + 1)*progression + "%)")
			$(slider).attr("data-currentslide",currentPos + 1);
			$(slider).parent().find('li').removeClass("active");
			console.log(currentPos)
			$(slider).parent().find('li:nth-child(' + (currentPos + 2) + ')').addClass("active");
		}
		}
	
}

$(window).resize(function(){
reJiggerSlideshow();

//if a clip is active, rejigger the transcription space so it fits correctly.
if(audioClips.currentClip)
{
$(audioClips.clips[audioClips.currentClip].transcriptDOM).height(audioClips.clips[audioClips.currentClip].maxTxtHeight() + "px");
}

if($(".ui-page-active").hasClass("stopPage"))
{
if((window.innerHeight > window.innerWidth && window.innerWidth < 1080) || window.innerWidth > 1079)//portrait and a mobile screen, let navbar float at the bottom of screen. If this is a desktop, css is setting the bar at the top all the time.
{
	hideNavOnLandscapeScroller('stop');
	$(".navbar").addClass("navbarin");
	$(".navbar").removeClass("navbarout");
}
else
{	$(".navbar").removeClass("navbarin");
	$(".navbar").addClass("navbarout");
	hideNavOnLandscapeScroller('start');
}
}
});

