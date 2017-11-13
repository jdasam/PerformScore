var midiOnsetBeatList = [];


function loadFiles(urlAddress){
	stop();
	$.xhrPool.abortAll;

	page = 1;

	makeArtistSelectOption(artistListOfPiece, "#artistSelect")



    $.get( urlAddress+"score.mei", function( data ) {
      set_options()
      vrvToolkit.loadData(data);

      //var svg = vrvToolkit.renderData( data + "\n", "" );

      load_page();

      xmlDoc = $.parseXML(data);

      //for (var rptMeasure, len = repeatInfo.length;)

	  getMidi(urlAddress+"(midi).mid");


      console.log("mei loaded");

    }, 'text');
		    


	theData = [ [] ];

	theData[0][1] = getCsv(urlAddress+'beatIndex.csv');

	// for (var i =0, len = artistListOfPiece.length; i<len; i++){
	// 	theData[i+1] = [ [],[] ];
	// 	getAudio(urlAddress,i+1,artistListOfPiece[i])
	// }


	var artistNameList = [];
	currentFileIndex = 1;

	// $.ajax({
 //    // beforeSend: function (xhr) {
 //    //     xhr.setRequestHeader('Authorization', 'Basic ' + btoa('myuser:mypswd'));
 //    // },
	//     url: urlAddress,
	//     success: function (data) {
	//         //List all .png file names in the page
	//         var totalNumberOfRecords = 0;
	//         var index =1;
	//         $(data).find("a").each(function(){
	//         	if(this.href.split('.').pop() == "csv"){
	//         		var fileName = this.href.split("/");
	// 	            var artistName = unescape(fileName[fileName.length-1].split(".")[0])

	// 	            if(artistName!="beatIndex") {
	// 	      			totalNumberOfRecords++;
	// 	            	theData[totalNumberOfRecords]= [[],[] ];  
	// 		            fileList.push(artistName);
	// 		            getAudio(urlAddress,index, artistName);
	// 		            index++;
	// 	            }

	//         	}
	//         })
	//     },
	//     error: function(data){
	//     	console.log("error in loading mp3 files");

	//     }
	// });

}


function getAudioByList(selectedList, url){


	for (var i =0, len = selectedList.length; i<len; i++){
		theData[i+1] = [ [],[] ];
		getAudio(url,i+1,selectedList[i])
	}

}


/*
function audioFileDecoded(audioBuffer){

	var i = 1;

	while (theData[i][0].length){
		i++;
	}

	theData[i][0] = audioBuffer;
	theData[i][1] = getCsv(sourceDir+fileList[i-1]+".csv");
	
	if(i==1) {
		//playSound(audioBuffer);
		//drawProgress(document.getElementById("progressCanvas"));
	}
	
}

function loadSound(url) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

	// When loaded decode the data
	request.onload = function() {

		// decode the data
		context.decodeAudioData(request.response, audioFileDecoded, audioFileDecodeFailed);
	}
	request.send();
}
*/



function audioFileDecodeFailed(e){
	alert("The audio file cannot be decoded!");
}




function setupAudioNodes() {
  // create a buffer source node
	sourceNode = audioContext.createBufferSource();
  sourceNode2 = audioContext.createBufferSource();
  gainNode1 = audioContext.createGain ?
              audioContext.createGain() : audioContext.createGainNode();
  gainNode2 = audioContext.createGain ?
              audioContext.createGain() : audioContext.createGainNode();
	// and connect to destination
	sourceNode.connect(gainNode1);
  gainNode1.connect(audioContext.destination);
  // create a buffer source node
	// and connect to destination
	sourceNode2.connect(gainNode2);
  gainNode2.connect(audioContext.destination);
}



//audio file playback control


function playSound(audioBuffer) {
	if (loadCompleted == false) return;
	if (startOffset < 0 ) startOffset =0;

	pause();

	setupAudioNodes(); //이거 사실 한번만 호출해 두면 될 것 같은데...
	startTime = audioContext.currentTime;
  sourceNode.buffer = audioBuffer;
  sourceNode2.buffer = audioBuffer;
  gainNode1.gain.value = 0.9;
  gainNode2.gain.value = 0.0;
  sourceNode.start(0, startOffset % audioBuffer.duration);
  sourceNode2.start(0, startOffset % audioBuffer.duration);
	playingOn = true;

	 drawProgress(document.getElementById("progressCanvas"));
}

function pause() {
	if (playingOn == false) return;
	sourceNode.stop();
  	sourceNode2.stop();
	// Measure how much time passed since the last pause.
	startOffset += audioContext.currentTime - startTime;
	playingOn = false;
}

function stop() {
	if (playingOn == false) {
		startOffset = 0;
		return;}
	sourceNode.stop();
  	sourceNode2.stop();
	startOffset = 0;
	playingOn = false;
	// drawProgress(document.getElementById("progressCanvas"));
}

function switchAudio(targetIndex){
	if (targetIndex == currentFileIndex) return;

	if(playingOn) {
	    sourceNode2.stop();
	    sourceNode2 = audioContext.createBufferSource();
	    sourceNode2.buffer = sourceNode.buffer;
	    gainNode2 = audioContext.createGain();
	    sourceNode2.connect(gainNode2);
	    gainNode2.connect(audioContext.destination);
	    //gainNode2.gain.value = 0.0;
	    sourceNode2.start(0, startOffset % sourceNode.buffer.duration);
	    sourceNode.stop();
	  } else {
	  	currentFileIndex = targetIndex; 
	  	applyVelocity2svg(xmlSvg, midiNotesList, meiNotesList);
	  	drawTempoCurve(xmlSvg, midiNotesList, meiNotesList, theData[0][1]);
  		if (startOffset) startOffset = indexInterpolation(startOffset, theData[currentFileIndex][1], theData[targetIndex][1]); // 재생시간을 앞서 멈췄던 부분과 같은 음표로 조정
		if (isNaN(startOffset)) startOffset = 0; // 에러 방지용
	  	return
	  }

  sourceNode = audioContext.createBufferSource();
  gainNode1 = audioContext.createGain();

	startTime = audioContext.currentTime; // startOffset(상대시간)을 기록하기 위해서는 재생시작 절대시간 startTime을 설정해야함

  sourceNode.connect(gainNode1);
  gainNode1.connect(audioContext.destination);

	sourceNode.buffer = theData[targetIndex][0]; // setupAudioNodes로 다시 만든 sourceNode의 버퍼를 사용자가 선택한 녹음의 오디오 버퍼로 설정
	if (startOffset) startOffset = indexInterpolation(startOffset, theData[currentFileIndex][1], theData[targetIndex][1]); // 재생시간을 앞서 멈췄던 부분과 같은 음표로 조정
	if (isNaN(startOffset)) startOffset = 0; // 에러 방지용


	sourceNode.start(0, startOffset % theData[targetIndex][0].duration); // startOffset 위치에서 소스노드를 시작
  //gainNode1.gain.value = 0.5;
  gainNode2.gain.setValueAtTime(1, audioContext.currentTime);
  gainNode1.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gainNode2.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 5);
  gainNode1.gain.exponentialRampToValueAtTime(1, audioContext.currentTime + 0.5);
	playingOn = true; //재생상태 갱신

	currentFileIndex = targetIndex; //현재 선택한 녹음 인덱스 갱신
}

function doMouseDown(e){
	//var currentTime = remainingSeconds;
	var rect = e.target.getBoundingClientRect();
	var x= e.clientX-rect.left - e.target.clientLeft + e.target.scrollLeft;
	var x= e.clientX
	canvasWidth = $(window).width()

	canvas_x = x/canvasWidth * theData[currentFileIndex][0].length / theData[currentFileIndex][0].sampleRate;
	
	startOffset = canvas_x;

    //move2Measure(playedMeasureNumber, theData[currentFileIndex][1], theData[0][1]);

	if (playingOn){
		pause();
		playSound(theData[currentFileIndex][0]);

	} else {
		var playedMeasureNumber = time2Measure(startOffset, theData[currentFileIndex][1], theData[0][1]);
	    var xmlid = parseMeasure(xmlDoc, playedMeasureNumber);
		if (page != vrvToolkit.getPageWithElement(xmlid)){
	        page = vrvToolkit.getPageWithElement(xmlid);
	        load_page();    		
		}

		$(measureNumber).val(playedMeasureNumber)
	    // highlightingMeasure(xmlid);
	    drawProgress(document.getElementById("progressCanvas"));
	    showPlaybar(startOffset ,theData[currentFileIndex][1], theData[0][1], midiNotesList, meiNotesList, xmlSvg);
	}

}



//calculate volume using simple linear array


function drawProgress(canvas){
	var progress = canvas.getContext("2d");
	// var gradient = progress.createLinearGradient(0, 0, 170, 0);
	// gradient.addColorStop(0, "white");
	// gradient.addColorStop(1, "orange");
	canvasWidth = canvas.width;
	var currentProgressInX = startOffset * canvasWidth /theData[currentFileIndex][0].length * theData[currentFileIndex][0].sampleRate;
	progress.clearRect(0, 0, canvas.width, canvas.height);

	progress.beginPath();
	progress.rect(0,0,currentProgressInX,canvas.height)
	progress.fillStyle = "#29486D";
	progress.fill();

    progress.stroke();    
    
    if (playingOn){
    	startOffset += audioContext.currentTime - startTime;
    	startTime = audioContext.currentTime;

    	var playedMeasureNumber = time2Measure(startOffset + 0.05, theData[currentFileIndex][1], theData[0][1]);
    	var xmlid = parseMeasure(xmlDoc, playedMeasureNumber);
    	if (page != vrvToolkit.getPageWithElement(xmlid)){
	        page = vrvToolkit.getPageWithElement(xmlid);
	        load_page();    		
    	}

    	$(measureNumber).val(playedMeasureNumber)
        // highlightingMeasure(xmlid);

        // var playedNotesID = time2notes(startOffset +0.05, theData[currentFileIndex][1], theData[0][1], midiNotesList, meiNotesList);
        // console.log(playedNotesID);
        // for(var i = 0, len = playedNotesID.length; i<len; i++){
        // 	highlightingNote(playedNotesID[i])
        // }

        showPlaybar(startOffset + 0.02,theData[currentFileIndex][1], theData[0][1], midiNotesList, meiNotesList, xmlSvg);
		requestAnimFrame(function() {
			drawProgress(document.getElementById("progressCanvas"))
		});
    }

    
    // drawProgressIndex++;

}


function indexInterpolation(currentSecond, csvArray, csvArraySwitch){
	var i = csvArray.binaryIndexOf(currentSecond);


	var interpolation = (currentSecond - csvArray[i]) / (csvArray[i+1] - csvArray[i]);
	return csvArraySwitch[i] + interpolation * (csvArraySwitch[i+1] - csvArraySwitch[i])


}


function time2Measure(currentSecond, csvAudio, csvBeat){
	var beat = time2beat(currentSecond, csvAudio, csvBeat);

	var targetMeasure = measureBeat.binaryIndexOf(beat);
	targetMeasure = rptStructure[targetMeasure];

	return targetMeasure
}

function time2currentNotes(currentSecond, csvAudio, csvBeat){
	var i = csvAudio.binaryIndexOf(currentSecond);


}


function time2orderedMeasure(currentSecond, csvAudio, csvBeat){
	var i = csvAudio.binaryIndexOf(currentSecond);
	var beat = csvBeat[i]

	var targetMeasure = measureBeat.binaryIndexOf(beat);

	return targetMeasure

}

function measure2Time(currentMeasure, csvAudio, csvBeat){
	var i = 0;

	// find nearest playing position that play selected measure
	var candidates = new Array();
	var pos = rptStructure.indexOf(currentMeasure*1);

	while(pos > -1){
	    candidates.push(pos);
	    pos = rptStructure.indexOf(currentMeasure*1, pos + 1);
	}

	var indexFloor = 0;
	if (candidates.length > 1){
		var playingMeasure = time2orderedMeasure(startOffset, theData[currentFileIndex][1], theData[0][1]);
		indexFloor = candidates.binaryIndexOf(playingMeasure);

		if(indexFloor != candidates.length-1){
			var floorDif = playingMeasure - candidates[indexFloor];
			var ceilDif = candidates[indexFloor+1] - playingMeasure;

			if (floorDif > ceilDif) indexFloor = indexFloor + 1;
		}
	}

	var currentMeasureInOrder = candidates[indexFloor];
	//var currentMeasureInOrder = rptStructure.indexOf(currentMeasure*1);
	var targetBeat = measureBeat[currentMeasureInOrder];
	var index = csvBeat.binaryIndexOf( targetBeat );

	// (csvBeat[i] - formerBeat) / ;

	
	
	if (csvBeat[index+1] - csvBeat[index] != 0){
		var interpolation = (targetBeat - csvBeat[index]) / (csvBeat[index+1] - csvBeat[index]);
		if(isNaN(interpolation)) interpolation = 0;
	} else var interpolation = 0;
	var targetSecond = csvAudio[index] + interpolation * (csvAudio[index+1] - csvAudio[index])
	//console.log(currentMeasure);


	return targetSecond
}


function move2Measure(targetMeasure, csvAudio, csvBeat){
	if(playingOn){
		pause();
		startOffset = measure2Time(targetMeasure, csvAudio, csvBeat);
		playSound(theData[currentFileIndex][0]);
		drawProgress
	} else{
		startOffset = measure2Time(targetMeasure, csvAudio, csvBeat);
		showPlaybar(startOffset + 0.02,theData[currentFileIndex][1], theData[0][1], midiNotesList, meiNotesList, xmlSvg);
	}

}

function time2beat(currentSecond, csvAudio, csvBeat){
	var i = csvAudio.binaryIndexOf(currentSecond);
	var beat;
	//var beat = csvBeat[i]

	if(i+1 != csvAudio.length){
		var interpolation = (currentSecond - csvAudio[i]) / (csvAudio[i+1] - csvAudio[i]);
		if(interpolation<0) interpolation = 0;
		beat =  csvBeat[i] + interpolation * (csvBeat[i+1] - csvBeat[i]);
	} else beat =  csvBeat[i];

	return beat;
}


function time2notes(currentSecond, csvAudio, csvBeat, midiNotes, meiNotes){
	//return xml:id of currently playing notes
	var beat = time2beat(currentSecond, csvAudio, csvBeat);

	var currentNotes = midiNotes.filter(function(e){return e.beatIndex<beat && e.endIndex>beat});
	var currentNotesID = [];

	for(var i=0, len=currentNotes.length; i<len; i++){
		currentNotesID[i] = findMeiIDorVelocity(meiNotes, currentNotes[i]);
	}

	return currentNotesID
}


function beat2position(beat, meiNotes, svg){
	

	var maxIndex = meiNotes.findIndex(function(e){return e.beatIndex > beat+0.000001} );
	if (maxIndex == -1) maxIndex = meiNotes.length - 1;
	// var minIndex = meiNotes.slice().reverse().findIndex(function(e){return e.beatIndex <= beat});
	// minIndex = meiNotes.length - 1 - minIndex;
	var minIndex = maxIndex -1;
	var xPositionList = [];
	// if (typeof(meiNotes[minIndex] ) == "undefined") console.log([minIndex, beat]);
	var precedingNoteID = meiNotes[minIndex].xmlid;
	var followingNoteID = meiNotes[maxIndex].xmlid;

	var precedingNoteBeat = meiNotes[minIndex].beatIndex;
	var followingNoteBeat = meiNotes[maxIndex].beatIndex;

		// var noteSvg = $(svg).find('g[id="'+precedingNoteID+'"]')[0];

	for (var i=0; minIndex-i>=0; i++){
		if(meiNotes[minIndex-i].beatIndex != precedingNoteBeat) break
		var candidateID = meiNotes[minIndex-i].xmlid;
		var noteSvg = document.getElementById(candidateID);
		if(noteSvg === null) return
		var candidatePosition  = noteSvg.getElementsByTagName("use")[0].getAttribute('x');

		xPositionList.push(candidatePosition)
	}
	xPositionList = xPositionList.sort(function(a,b){return Number(a)-Number(b)});
	var xPrecedingPosition = xPositionList[0];
	// var xPrecedingPosition = $(noteSvg).find("use")[0].getAttribute("x");


	var time1 = new Date();
	var precedingSystemID = findSystemID(precedingNoteID, svg);
	if(typeof $(svg).find('g[id="'+followingNoteID+'"]')[0] ===  'object') var followingSystemID = findSystemID(followingNoteID, svg);
	else followingSystemID = -1;

	if(followingNoteBeat == precedingNoteBeat){
		followingNoteBeat = meiNotes[maxIndex].endIndex;
		followingSystemID = -1;
	}


	// var currentSystem = $(svg).find('g[id="'+precedingSystemID+'"]')[0];
	var currentSystem = document.getElementById(precedingSystemID);

	// var measuresInSystem = $(currentSystem).find('g[class="measure"]')
	var measuresInSystem = currentSystem.getElementsByClassName("measure");

	// var yPos = $(currentSystem).find("path")[0].getAttribute('d').replace(/[A-Z]/g,'').split(' ')
	var yPos = currentSystem.getElementsByTagName("path")[0].getAttribute('d').replace(/[A-Z]/g,'').split(' ')


	if (precedingSystemID == followingSystemID){
		// var followingNoteSvg = $(svg).find('g[id="'+followingNoteID+'"]')[0];
		xPositionList = [];
		for (var i=0, len = 10; i<len; i++){
			if ( maxIndex+i == meiNotes.length || meiNotes[maxIndex+i].beatIndex > followingNoteBeat+0.000001) break
			var candidateID = meiNotes[maxIndex+i].xmlid;
			var noteSvg = document.getElementById(candidateID);
			if (! noteSvg){
				console.log(meiNotes[maxIndex+i]);
			}
			var candidatePosition  = noteSvg.getElementsByTagName("use")[0].getAttribute('x');

			xPositionList.push(candidatePosition)
		}
		xPositionList = xPositionList.sort(function(a,b){return Number(a)-Number(b)});
		var xFollowingPosition = xPositionList[0];

		// var followingNoteSvg = document.getElementById(followingNoteID);
		// var xFollowingPosition =  followingNoteSvg.getElementsByTagName("use")[0].getAttribute("x");

		// var xFollowingPosition =  $(followingNoteSvg).find("use")[0].getAttribute("x");
	}
	else {
	    // var lastMeasurePath = $(measuresInSystem[measuresInSystem.length -1]).find("path");
	    var lastMeasurePath = measuresInSystem[measuresInSystem.length -1].getElementsByTagName("path");
		var positionList = [];
		for (var i = 0; i<lastMeasurePath.length; i++){
			var position = lastMeasurePath[i].getAttribute('d').replace(/[A-Z]/g,'').split(' ')
			for (var j = 0; j<position.length; j++){
			  position[j] = position[j] * 1;
			}
				positionList.push(position)
		}

		var xFollowingPosition = 0;
		for (var i = 0; i<positionList.length; i++){
			if (positionList[i][2] > xFollowingPosition) xFollowingPosition = positionList[i][2];
		}
	}
	var time2 = new Date();

	// var time3 = new Date();

	// console.log(time2-time1);
	// console.log(time3-time2);

	var xPos = Number(xPrecedingPosition) + (Number(xFollowingPosition) - Number(xPrecedingPosition)) / (followingNoteBeat - precedingNoteBeat) * (beat - precedingNoteBeat);

	return [String(xPos), yPos[1], yPos[3]];

}

function beat2tempo(beat1, csvAudio, csvBeat, csvOnset , windowLength){
	// var index1 = csvBeat.binaryIndexOf(beat1);
	// if (index1 == csvBeat.length-1) return 0;
	// var audio1 = csvAudio[index1];
	// var beat2 = csvBeat[index1+1];
	// var audio2 = csvAudio[index1+1];


	// if (audio1 == audio2) {
	// 	for(var i =2, len= csvAudio.length - index1; i<len; i++){
	// 		if(csvAudio[index1+i] != csvAudio[index1]){
	// 			audio2 = csvAudio[index1+i];
	// 			beat2 = csvBeat[index1+i];
	// 			break
	// 		}
	// 	}
	// } 
	// var tempo =  (beat2-beat1) / (audio2 - audio1);

	/*
    if (windowLength === undefined) {
      windowLength = 1;
    }
    var indexCenter = csvBeat.binaryIndexOf(beat1);
    var indexLeft = csvBeat.binaryIndexOf(beat1-windowLength/2);
    var indexRight = csvBeat.binaryIndexOf(beat1+windowLength/2);

 	var beatLeft = csvBeat[indexLeft];
 	var beatRight = csvBeat[indexRight];

 	var audioTimeLeft = csvAudio[indexLeft];
 	var audioTimeRight = csvAudio[indexRight];

 	if (audioTimeRight == audioTimeLeft) audioTimeRight = audioTimeLeft + 0.1;

 	var tempo = (beatRight - beatLeft) / (audioTimeRight - audioTimeLeft)
 	*/
	if (windowLength === undefined) {
      windowLength = 2; //half of the window length
    }
    windowLength = Math.ceil(windowLength);
    var indexCenter = csvBeat.binaryIndexOf(beat1);
    var onsetIndex = csvOnset.binaryIndexOf(beat1);
    if(onsetIndex-windowLength >= 0 ){
	    var indexLeft = csvBeat.binaryIndexOf( csvOnset[onsetIndex-windowLength]  );
	}
	else{
	    var indexLeft = csvBeat.binaryIndexOf(csvOnset[0] );
	}
	var onsetListLength = csvOnset.length;
    if(onsetIndex+windowLength < onsetListLength ){
	    var indexRight = csvBeat.binaryIndexOf( csvOnset[onsetIndex+windowLength]  );
	}
	else{
	    var indexRight = csvBeat.binaryIndexOf( csvOnset[onsetListLength-1] );
	}
 	var beatLeft = csvBeat[indexLeft];
 	var beatRight = csvBeat[indexRight];

 	var audioTimeLeft = csvAudio[indexLeft];
 	var audioTimeRight = csvAudio[indexRight];

 	if (audioTimeRight == audioTimeLeft) audioTimeRight = audioTimeLeft + 0.1;

 	var tempo = (beatRight - beatLeft) / (audioTimeRight - audioTimeLeft)

	return tempo

}


function findSystemID(xmlid, svg){
	// var parent = $(svg).find('g[id= "'+ xmlid + '"]')[0].parentElement
	var parent = document.getElementById(xmlid).parentElement
	if (parent.getAttribute("class") == "system"){
		return parent.getAttribute("id");
	}
	else 
		var newID = parent.getAttribute("id");
		return findSystemID(newID, svg);
}

function makeOnsetBeatList(midiNotes){
	var midiOnsetBeatList = [];
	midiNotes.filter(function(el) {
	// If it is not a duplicate, return true
	if (midiOnsetBeatList.indexOf(el.beatIndex) == -1) {
		midiOnsetBeatList.push(el.beatIndex);
		return true;
		}
		return false;        
	});

	midiOnsetBeatList = midiOnsetBeatList.sort(function(a,b){return a-b} );
	// console.log(beatInPage);

	return midiOnsetBeatList;
}

function calculateTempoCurveWithAdaptiveWindow(csvAudio, csvBeat, csvOnset){
	for(var i =0, len = csvOnset.length; i<len; i++){
		// TODO??
	}
}


function removeLedger(positionList){
	var lengthList = [];

	for (var i = 0; i<positionList.length; i++){

	}
}



function getAudio(url, index, artistName)
{
    var xmlhttp

    if (window.ActiveXObject)
    {
     xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    else if (window.XMLHttpRequest)
    {
     xmlhttp = new XMLHttpRequest();
    } 
    xmlhttp.responseType = "arraybuffer";
    xmlhttp.onload = function()
    {
	    var i = $.xhrPool.indexOf(xmlhttp);   //  get index for current connection completed
        if (i > -1) $.xhrPool.splice(i, 1); //  removes from list by index

		context.decodeAudioData(xmlhttp.response, function(audioBuffer){
			theData[index][0] = audioBuffer;
			theData[index][1] = getCsv(url+artistName+".csv");
			theData[index][2] = getCsv(url+artistName+"_vel.csv");
			// var surName = artistName.split(",")[0]
			// var performIndexOfSameArtist = /\([0-9]\)/.exec(artistName);

			// if(performIndexOfSameArtist) surName = surName + " " + performIndexOfSameArtist;

			// if (index==1 ){
			// 	var button='<button class="btn btn-primary" id="'+unescape(artistName)+'" >'+surName+'</button>' 
			// } else{
			// 	var button='<button class="btn btn-default" id="'+unescape(artistName)+'" >'+surName+'</button>'
			// }
            //$("#audioFile-buttons").append(button);

            loadedFileNumber++;

            if (loadedFileNumber == selectedAudioList.length){
            	loadCompleted = true;
            	makeArtistButton(selectedAudioList, "#audioFile-buttons");
            	$(loadAudio).removeClass("btn btn-darkblue").addClass("btn panel-default");
            	setTimeout(function(){
            		applyVelocity2svg(xmlSvg, midiNotesList, meiNotesList);
			        drawTempoCurve(xmlSvg, midiNotesList, meiNotesList, theData[0][1]);}
            		, 500)
            	
            }

		}, audioFileDecodeFailed)
    }

    xmlhttp.open("GET",url+artistName+".mp3",true);
    $.xhrPool.push(xmlhttp);
    xmlhttp.send();
}


function getMidi(url)
{
    var xmlhttp

    if (window.ActiveXObject)
    {
     xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    else if (window.XMLHttpRequest)
    {
     xmlhttp = new XMLHttpRequest();
    } 
    xmlhttp.responseType = "arraybuffer";
    xmlhttp.onload = function()
    {
		
    	timeSignature = [];
    	midiNotesList = [];
		midiFile = new MIDIFile(xmlhttp.response);
		console.log("get midi work");
		var ticksPerBeat = midiFile.header.getTicksPerBeat();
		var numberOfTracks = midiFile.header.getTracksCount();
		var j=0;
		var k=0;
		
		for (var n=0 ; n < numberOfTracks; n ++){
			var midEvents = midiFile.getTrackEvents(n);

			var absoluteTime = 0;
			var timeSigMeasure = 0;
			for (var i=0, len=midEvents.length; i<len; i++){
				absoluteTime = absoluteTime + midEvents[i].delta;
				if(n==0){
					if(midEvents[i].subtype == 88) {
						if(j>0){
							timeSigMeasure = timeSignature[j-1][2] + (absoluteTime - timeSignature[j-1][1]) / ( ticksPerBeat * timeSignature[j-1][0].param1 / Math.pow(2, timeSignature[j-1][0].param2 -2 ));
							if (! Number.isInteger(timeSigMeasure)){
								timeSignature[j-1][0].param2 = 6;
								timeSigMeasure = timeSignature[j-1][2] + (absoluteTime - timeSignature[j-1][1]) / ( ticksPerBeat * timeSignature[j-1][0].param1 / Math.pow(2, timeSignature[j-1][0].param2 -2 ));
							}
						}
						timeSignature[j] = [midEvents[i], absoluteTime, timeSigMeasure];
						j++;
					}
				}
				if(midEvents[i].subtype==9){
					midiNotesList[k] = {'pitch':midEvents[i].param1, 'velocity':midEvents[i].param2 , 'beatIndex':absoluteTime/ticksPerBeat};
					k++;
				}
				if(midEvents[i].subtype==8){
					for(var reverseIndex = 1; reverseIndex<=k; reverseIndex++){
						if (midiNotesList[k-reverseIndex].pitch == midEvents[i].param1 && !(midiNotesList[k-reverseIndex].endIndex)){
							midiNotesList[k-reverseIndex].endIndex = absoluteTime/ticksPerBeat;
						}
					}
				}
			}
		}
		var rptInfo = searchRepeatInformation();
	  	rptStructure = makeRepeatInfoInMeasure(rptInfo);
	  	measureBeat = makeMeasureInfoInBeat(rptStructure);
	  	for (var i=0, len = rptStructure.length; i<len; i++){
	  		midiMeasure2xmlBeat[i] = measureBeat[rptStructure[i]];
	  		xmlMeasure2midiBeat[i] = measureBeat[rptStructure.indexOf(i)];
	  	}


		[meiNotesList, xmlMeasureBeat] = meiNote2beatArray(xmlDoc);
		midiNotesList.sort(function(a,b){ return a.beatIndex - b.beatIndex});
		midiOnsetBeatList = makeOnsetBeatList(midiNotesList);

		mei2midiMapArray = mei2midiMatching(midiNotesList, meiNotesList);


        applyVelocity2svg(xmlSvg, midiNotesList, meiNotesList)
        drawTempoCurve(xmlSvg, midiNotesList, meiNotesList, theData[0][1]);


    }

    xmlhttp.open("GET",url,true);
    xmlhttp.send();
}


function getCsv(url){
	var resultArray = [];

	Papa.parse(url, {
		download: true,
		dynamicTyping: true,
		complete: function(results) {
			for (var i=0, len=results.data[0].length; i<len-1; i++){
				resultArray[i] = results.data[0][i];
			}
		}
	});

	return resultArray;
}


function binaryIndexOf(searchElement) {
    'use strict';
 
    var minIndex = 0;
    var maxIndex = this.length - 1;
    var currentIndex;
    var currentElement;
    var diff;
    var minimumDiff;

    if (searchElement < this[minIndex]){
    	return 0;
    }
 
    while (minIndex < maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = this[currentIndex];
        //console.log([currentElement, minIndex, maxIndex])
 
        if (currentElement < searchElement  ) {
            if (this[currentIndex+1]>searchElement) return currentIndex;
            else minIndex = currentIndex+1;
            if (minIndex == maxIndex && this[maxIndex]>searchElement) return currentIndex;
        }
        else if (currentElement > searchElement) {
            maxIndex = currentIndex - 1;
        }
        else {
            while(this[currentIndex+1]==searchElement) currentIndex++
            return currentIndex;
        }
    }

    return Math.min(minIndex, maxIndex);
}
Array.prototype.binaryIndexOf = binaryIndexOf;




function folder2Composer(dataArray){
	for (var i = 0, len = dataArray.length, k=0; i< len; i++){
		var composerName = dataArray[i].name.split(' ')[0]
	    if (composerArray.indexOf(composerName) == -1){
	      composerArray.push(composerName);
	      pieceList[k] = [];
	      artistList[k] = [];
	      // pieceAddress[k] = [];
	      k++;
	  	}
  	}
	composerArray.sort();

	for (var l = 0, clen = composerArray.length; l<clen; l++) {
		$('#composerUl').append('<li><a onclick=composerSelect("'+composerArray[l]+'")>'+composerArray[l]+'</a></li>')
	}


	for (var j = 0, len = dataArray.length; j< len; j++){
    	var composerIndex = composerArray.indexOf(dataArray[j].name.split(' ')[0]);
    	var tempPieceName = getNameByDepth(dataArray[j]);
    	var tempArtistName = getArtistByDepth(dataArray[j]);

    	// var tempAddress = getAddressByDepth(dataArray[j]);

    	for (var n = 0, nlen = tempPieceName.length; n< nlen; n++){
    		pieceList[composerIndex].push(tempPieceName[n]);
    		artistList[composerIndex].push(tempArtistName[n]);
    	}
    	// tempPieceName.forEach(function (d){
    	// 	pieceList[composerIndex].push(d);
    	// 	//artistList[composerIndex][pieceList[composerIndex].length-1] = tempArtistName 
    	// });


    	// tempAddress.forEach(function (e){
    	// 	pieceAddress[composerIndex].push(e);
    	// })
  	}

  	var dummyPieceList = deepCopy(pieceList);
  	var dummyArtistList = deepCopy(artistList);

  	for (var n =0, nlen=pieceList.length; n<nlen; n++){
  		pieceList[n].sort(sortAlphaNum);
  	}

  	for (var n =0, nlen=pieceList.length; n<nlen; n++){
  		for (var nn = 0, nnlen = pieceList[n].length; nn<nnlen; nn++){
  			var index = dummyPieceList[n].indexOf(pieceList[n][nn]);
  			dummyArtistList[n][nn] = artistList[n][index];
  		}
  	}

  	artistList = dummyArtistList;
}

function composerSelect(name){
	$("#dropButtonComposer").text(name);
	var composerIndex = composerArray.indexOf(name);

	$('#pieceUl').empty()

	for (var i=0, len = pieceList[composerIndex].length; i<len; i++){
		var tempPieceName = pieceList[composerIndex][i].replace(name+' ', '').replaceAll(" - ", ' ');
		$('#pieceUl').append('<li><a onclick=pieceSelect(['+composerIndex+','+i+'])>'+tempPieceName+'</a></li>');
	}

}

function pieceSelect(address){

	var url = "sourceFiles/".concat(pieceList[address[0]][address[1]].replaceAll(" - ", "/")).concat("/");
	sourceDir = url;

	if (confirm("Load this piece?") == true) {
		var pieceName = pieceList[address[0]][address[1]];
		pieceName = pieceName.replace(pieceName.split(' ')[0]+' ', '').replaceAll(" - ", ' ')

		$("#dropButtonPiece").text(pieceName);

		artistListOfPiece = artistList[address[0]][address[1]];
		$("#audioFile-buttons").empty();
		selectedAudioList = [];
		loadFiles(url);
	} else return

}


function getDepth (obj) {
  var depth = 0;
  if (obj.children) {
      obj.children.forEach(function (d) {
          var tmpDepth = getDepth(d)
          if (tmpDepth > depth) {
              depth = tmpDepth
          }
      })
  }
  return 1 + depth
}

function getNameByDepth (obj){
  var pieceName = obj.name;
  var nameList = [];

  //var address = obj.name;

  if (obj.children){
  	if(obj.children[0].type == "folder"){
	    obj.children.forEach(function(d) {
	      var tempPieceName = getNameByDepth(d);
	      tempPieceName.forEach(function(e){
	        nameList.push(pieceName.concat(" - ").concat(e));
	      })
	      //address = address.concat("/").concat(d.name);
	    })
	}
  }

  if(nameList == 0) nameList.push(pieceName);

  return nameList
}

function getArtistByDepth (obj){
  var nameList = [ ];


  if (obj.children){
  	if(obj.children[0].type == "folder"){
	    obj.children.forEach(function(d) {
	      var tempArtistName = getArtistByDepth(d);
	      tempArtistName.forEach(function(e){
	      	nameList.push(e);
	      });
	      //address = address.concat("/").concat(d.name);
	    });
	}else{
		nameList=[ [] ];
		obj.children.forEach(function(d) {
	      var tempArtistName = d.name.split('.')[0];
	      if (tempArtistName != 'beatIndex') nameList[0].push(tempArtistName);
	  	})
	}
  }

  return nameList
}

function getAddressByDepth (obj){
  var pieceName = obj.name;
  var nameList = [];

  //var address = obj.name;

  if (obj.children){
    obj.children.forEach(function(d) {
      var tempPieceName = getAddressByDepth(d);
      tempPieceName.forEach(function(e){
        nameList.push(pieceName.concat("/").concat(e));
      })
      //address = address.concat("/").concat(d.name);
    })
  }

  if(nameList == 0) nameList.push(pieceName);

  return nameList
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function makeRepeatInfoInMeasure (repeatInfo){


	var measureActualOrder = [0]
	var measureNumber = 1;
	for(var i = 0, len = repeatInfo[0].length; i<len; i++ ){
		while (measureNumber <= repeatInfo[0][i]){
			measureActualOrder.push(measureNumber);
			measureNumber++;
		}
		measureNumber = repeatInfo[1][i];
		var repeatEnd = repeatInfo[0][i];


		//find whether there is alternative ending
		for(var j =0, lenB = repeatInfo[2].length; j<lenB; j++){
			if(repeatInfo[2][j] > repeatInfo[1][i] && repeatInfo[2][j] <= repeatInfo[0][i] ) {
				repeatEnd = repeatInfo[2][j] -1;

			}
		}

		while (measureNumber <= repeatEnd ){
			measureActualOrder.push(measureNumber);
			measureNumber++;
		}

		if (measureNumber != repeatInfo[0][i]+1){
			measureNumber = repeatInfo[0][i]+1;
		}

	}

	if (!repeatInfo.coda){

		while (measureNumber <= repeatInfo[3]){
			measureActualOrder.push(measureNumber);
			measureNumber++;
		}
	} else {
		var semiEnding = (repeatInfo.dacapo || repeatInfo.dalsegno);

		while (measureNumber <= semiEnding){
			measureActualOrder.push(measureNumber);
			measureNumber++;
		}
	}

	//if dacapo, go back to the first measure and go until fine
	if(repeatInfo.dacapo){
		measureNumber = 1;
		var ending;
		if (repeatInfo.fine){
			ending = repeatInfo.fine;
		}else if (repeatInfo.alcoda){
			ending = repeatInfo.alcoda;
		}else ending = repeatInfo[3];
		
		while (measureNumber <= ending ){ 
			measureActualOrder.push(measureNumber);
			measureNumber++;

			if(repeatInfo[2].indexOf(measureNumber) != -1){
				measureNumber = repeatInfo[4][repeatInfo[2].indexOf(measureNumber)];
			}
		}
	}else if(repeatInfo.dalsegno){
		measureNumber = repeatInfo.segno;
		var ending;
		if (repeatInfo.fine){
			ending = repeatInfo.fine;
		}else if (repeatInfo.alcoda){
			ending = repeatInfo.alcoda;
		}else ending = repeatInfo[3];

		while (measureNumber <= ending ){ 
			measureActualOrder.push(measureNumber);
			measureNumber++;

			if(repeatInfo[2].indexOf(measureNumber) != -1){
				measureNumber = repeatInfo[4][repeatInfo[2].indexOf(measureNumber)];
			}
		}
	}

	if(repeatInfo.alcoda){
		measureNumber = repeatInfo.coda;

		while (measureNumber <= repeatInfo[3] ){ 
			measureActualOrder.push(measureNumber);
			measureNumber++;
		}
	}


	return measureActualOrder;
}

function makeMeasureInfoInBeat(measureInfo){

	var measureBeat = [0];

	for(var i=1, len= measureInfo.length; i<len; i++ ){
		var timeSigZone = 0; 
		if (timeSignature.length != 1){
			while(i > timeSignature[timeSigZone+1][2]){ 
				timeSigZone++;
				if (timeSigZone + 1 == timeSignature.length) break;
			}
		}

		var beatInMeasure = timeSignature[timeSigZone][0].param1 / Math.pow(2, timeSignature[timeSigZone][0].param2 -2 );

		measureBeat.push(measureBeat[i-1]+beatInMeasure);
	}

	measureBeat.unshift(0);

	return measureBeat;
}


function searchRepeatInformation(){
	var repeatInfo = [[], [], [], [], []]; // 0.repeatEnd 1.repeatStart 2.alt ending start measure 3.ending measure number
	//4. alt ending second start measure 

	var rptEnd = $(xmlDoc).find('measure[right="rptend"]');
	var rptStart = $(xmlDoc).find('measure[left="rptstart"]');
	var altEnding =  $(xmlDoc).find('ending[n="1"]').find('measure');
	var altEnding2nd =  $(xmlDoc).find('ending[n="2"]').find('measure');

	var measureList = $(xmlDoc).find('measure');
	var ending = measureList[measureList.length-1].getAttribute('n');

	var dacapo = $(xmlDoc).find('measure[repeat="dacapo"]');
	var fine = $(xmlDoc).find('measure[repeat="fine"]');

	var alcoda = $(xmlDoc).find('measure[repeat="alcoda"]');
	var coda = $(xmlDoc).find('measure[repeat="coda"]');


	var dalsegno = $(xmlDoc).find('measure[repeat="dalsegno"]');
	var segno = $(xmlDoc).find('measure[repeat="segno"]');


	for(var i=0, len = rptEnd.length; i<len; i++){
	  	repeatInfo[0].push(rptEnd[i].getAttribute('n') * 1);
	}
	for(var j=0, lenB = rptStart.length; j<lenB; j++){
	  	repeatInfo[1].push(rptStart[j].getAttribute('n') *1);
	}
	for(var k=0, lenC = altEnding.length; k<lenC; k++){
	  	repeatInfo[2].push(altEnding[k].getAttribute('n') *1);
	  	repeatInfo[4].push(altEnding2nd[k].getAttribute('n') *1);
	}

	if (repeatInfo[0].length){
		if (repeatInfo[1].length == 0) repeatInfo[1][0] = 1;
		else if (repeatInfo[1][0] > repeatInfo[0][0]) repeatInfo[1].unshift(1);		
	}
	repeatInfo[3] = ending * 1;

	if (dacapo.length){
		repeatInfo.dacapo = dacapo[0].getAttribute('n') *1;
	}

	if (fine.length){
		repeatInfo.fine = fine[0].getAttribute('n') *1;
	}

	if (alcoda.length){
		repeatInfo.alcoda = alcoda[0].getAttribute('n') *1;
		repeatInfo.coda = coda[0].getAttribute('n') *1;
	}

	if (dalsegno.length){
		repeatInfo.dalsegno = dalsegno[0].getAttribute('n') *1;
		repeatInfo.segno = segno[0].getAttribute('n') * 1;
	}


	return repeatInfo;
}
  



function sortAlphaNum(a,b) {
	var reA = /[^a-zA-Z]/g;
	var reN = /[^0-9]/g;
    var aA = a.replace(reA, "");
    var bA = b.replace(reA, "");
    if(aA === bA) {
        var aN = parseInt(a.replace(reN, ""), 10);
        var bN = parseInt(b.replace(reN, ""), 10);
        return aN === bN ? 0 : aN > bN ? 1 : -1;
    } else {
        return aA > bA ? 1 : -1;
    }
}

function makeArtistButton(inputArray, buttonClass) {
	$(buttonClass).empty();

	inputArray.sort();

	for(var i =0, len=inputArray.length; i<len;i++){
		var artistName = inputArray[i];
		var surName = artistName.split(",")[0]
		var performIndexOfSameArtist = /\([0-9]\)/.exec(artistName);

		if(performIndexOfSameArtist) surName = surName + " " + performIndexOfSameArtist;


		if (i==0){
			var button='<button class="btn btn-darkblue" id="'+unescape(artistName)+'" >'+surName+'</button>' 
			} else{
			var button='<button class="btn btn-default" id="'+unescape(artistName)+'" >'+surName+'</button>'
		}
	    
	    $(buttonClass).append(button);


	    // if ( $("#audioFile-buttons").find('button').length == theData.length -1 ){
	    // 	loadCompleted = true;
	    // }

	}
}

function makeArtistSelectOption(inputArray, selectClass) {
	$(selectClass).empty();

	inputArray.sort();

	for(var i =0, len=inputArray.length; i<len;i++){
		var artistName = inputArray[i];
		// var surName = artistName.split(",")[0]
		// var performIndexOfSameArtist = /\([0-9]\)/.exec(artistName);

		// if(performIndexOfSameArtist) surName = surName + " " + performIndexOfSameArtist;


		var option='<option value="'+unescape(artistName)+'" >'+artistName+'</button>' 
			
	    
	    $(selectClass).append(option);


	    // if ( $("#audioFile-buttons").find('button').length == theData.length -1 ){
	    // 	loadCompleted = true;
	    // }

	}
   	$(selectClass).multiselect("refresh");
   	$(selectClass).multiselect({
		minWidth: 200
	});
}




function deepCopy(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for ( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for ( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
}


$(function() {
    $.xhrPool = [];
    $.xhrPool.abortAll = function() {
        $(this).each(function(i, jqXHR) {   //  cycle through list of recorded connection
            jqXHR.abort();  //  aborts connection
            $.xhrPool.splice(i, 1); //  removes from list by index
        });
    }

    $.ajaxSetup({
        beforeSend: function(jqXHR) { $.xhrPool.push(jqXHR); }, //  annd connection to list
        complete: function(jqXHR) {
            var i = $.xhrPool.indexOf(jqXHR);   //  get index for current connection completed
            if (i > -1) $.xhrPool.splice(i, 1); //  removes from list by index
        }
    });
})


function arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }

    return true;
}

