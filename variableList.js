var audioContext;
var sourceNode;
var startOffset = 0;
var startTime = 0;
var audioFile;
var playingOn=false;
var loadCompleted = false;
var loadInterupted = false;
var tempoCurveOn = false;
// var drawProgressIndex = 0;

var currentFileIndex = 1;
var theData = [ [] ];
var midiFile;

var timeSignature =[];
var rptStructure =[];
var measureBeat = [];
var midiNotesList = [];
var meiNotesList = [];
var midiMeasure2xmlBeat = [];
var xmlMeasure2midiBeat =[];
var mei2midiMapArray =[];
var xmlMeasureBeat = [];

var sourceDir = "sourceFiles/Chopin Etude op. 10/4/";
var fileextension = ".csv";
var loadedFileNumber = 0;

var composerArray = [];
var pieceList = []; 
var artistList = [];
//var artistListOfPiece = ['Barenboim, Daniel', 'Bernstein, Leonard', 'Cantelli, Guido', 'Dausgaard, Thomas', 'Furtwaengler, Wilhelm', 'Gardiner, John Eliot', 'Herreweghe, Philippe', 'Karajan, Herbert von', 'Klemperer, Otto', 'Kubelik, Rafael', 'Monteux, Pierre']
var artistListOfPiece = ["Cortot, Alfred", "Cortot, Alfred (2)", "Haas, Monique", "Harasiewicz, Adam", "Horowitz, Vladimir", "Richter, Sviatoslav", "Richter, Sviatoslav (2)",  "Vasary, Tamas"];
var selectedAudioList = [];
var selectedAudioPrev = [];
// var pieceAddress =[];

var contextClass = (window.AudioContext || 
  window.webkitAudioContext || 
  window.mozAudioContext || 
  window.oAudioContext || 
  window.msAudioContext);
if (contextClass) {
  // Web Audio API is available.
  var context = new contextClass();
} else {
  // Web Audio API is not available. Ask the user to use a supported browser.
  // Does this work?
  alert('The Web browser does not support WebAudio. Please use the latest version.');
}





window.onload=function(){
	$("#artistSelect").multiselect({
		noneSelectedText: "Select Artists",
		height: 300,
	});

	var items = [];
	
	$.getJSON( "dataWithFile.json", function( data ) {
	  items.push(data);
	  folder2Composer(items[0]);
	});

	var canvas = document.getElementById("progressCanvas");
	canvas.width = $('#progressBar').width();
	canvas.addEventListener("mousedown", doMouseDown, false);
    // var canvasWidth = document.getElementById("progressCanvas").width;
    // var canvasHeight = document.getElementById("progressCanvas").height;
	loadFiles(sourceDir);

	audioContext = new contextClass();
}

window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
})();