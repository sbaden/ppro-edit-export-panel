

function parseObj(obj){
 //    alert('Message: ' + obj.message + '\n' +
 //    	'Sequence Name: ' + obj.sequenceName + '\n' +
 //    	'Presets Path' + obj.presetsPath + '\n' +
 //    	'Preset: ' + obj.presetValue + '\n' +
 //    	'Preset Extension: ' + obj.presetExtension + '\n' +
 //    	'Export Path: ' + obj.exportPath + '\n' +
 //    	'XML Path: ' + obj.xmlPath
	// );

    // EXPORT XML
	if (app.project.activeSequence) {
        var projPath                    = new File(app.project.path);
        var parentDir                   = projPath.parent;
        var outputName                  = obj.sequenceName;
        var extention                	= '.xml';
        var outputPath                  = obj.xmlPath;

        if (outputPath) {
			var dateStamp = getDate();
			var timeStamp = getTime();

			//create external folder in file structure if not already created.
			var outputPath = outputPath + "/" + dateStamp;
			if (! outputPath.exists) { Folder(outputPath).create(); }

            var completeOutputPath = outputPath + getSep() + outputName + '_' + timeStamp + extention;
            app.project.activeSequence.exportAsFinalCutProXML(completeOutputPath, 1); // 1 == suppress UI
            var info = "Exported FCP XML for " + 
                app.project.activeSequence.name + 
                " to " + 
                completeOutputPath + 
                ".";
            // $.writeln(info);

            render(obj);
        }
        else { $.writeln("No output path chosen."); }
    }
    else { $.writeln("No active sequence."); }



	// EXPORT TIMELINE
	// project.exportTimeline(exportControllerName);
}

function getSep() {
	if (Folder.fs == 'Macintosh') {
		return '/';
	} else {
		return '\\';
	}
}

function getPresetPath(){
	var preset = {};
	var	homeDir		= new File('~/');

	preset.userName	= homeDir.displayName;
	homeDir.close();


	var projectPath = "/Users/"+ preset.userName +"/Documents/Adobe/Adobe Media Encoder/";
    var folder = new Folder (projectPath);
    var files = new Array();
    var folders = new Array();
    var fileName = '';
    
    files = folder.getFiles();
    
    for(i=0; i< files.length; i++){
        var fileToString = files[i].toString();
      
        if (fileToString.indexOf(".DS_Store") < 0){          
            if(files[i] instanceof Folder){
        		fileName = decodeURI(files[i].name);
                // alert(fileName);
                folders.push(fileName);
            }
        }
    }

    if(folders.length > 1){
        alert('There are more than one version folders: Please select the version folder you would like to use.');

        var targetDirectory = folder.selectDlg();  // Select a folder
                
	    if (targetDirectory != null){  // Verify folder was selected
	        directory = decodeURI(targetDirectory.fsName);  // Convert folder path to readable text
	        
	        fileName = directory;
	    }

        var target = fileName.lastIndexOf('/');
        preset.versionFolder = fileName.substring(target+1, fileName.length);
    }
    else{
    	preset.versionFolder = fileName;
    }
	
    return JSON.stringify(preset);
}

function verifyDefaultPreset(obj){
	var folder = new Folder (obj.presetsPath);
    var files = folder.getFiles();
    var presetDefaultFile = obj.presetValue + obj.presetExtension;
    var valid = false;

    for(i=0; i < files.length; i++){ // Loop through array looking for file types
        var fileName = File.decode(files[i].name);
        // alert(fileName);
        if (fileName.toUpperCase() == presetDefaultFile.toUpperCase()){
            return valid = true;
        }
        else{ valid = false; }
    }
    return valid;
}

function returnDirectory(){
	var targetDirectory = Folder.selectDialog();  // Select a folder
                
    if (targetDirectory != null){  // Verify folder was selected
        directory = decodeURI(targetDirectory.fsName);  // Convert folder path to readable text
        
        return directory;
    }
}

function returnActiveSequence(){
	var seqName = "No active sequence."

	var active_seq = app.project.activeSequence;

	if (active_seq != null) {
	    seqName = active_seq.name;
	}
	
	return seqName;
}

function getFiles(targetDirectory){
    var folder = new Folder (targetDirectory);
    var files = folder.getFiles();
    var sortedFiles = [];
    
    for(i=0; i < files.length; i++){ // Loop through array looking for file types
        var fileName = File.decode(files[i].name.toLowerCase());
        
        if (! fileName.match(/\.(epr)$/)){ // Removes all files that are not script files from the array
            files.splice(i, 1);  // First param defines the position where array will be spliced. Second param defines how many elements should be removed.
        }
    }

    files.sort();

    for(i=0; i < files.length; i++){
        var fileToString = File.decode(files[i].name.toLowerCase())
        
         if (fileToString.match(/\.(epr)$/)){
            fileToString = fileToString.substring(0, fileToString.lastIndexOf("."));
            sortedFiles.push(fileToString.toUpperCase());
        }
    } 

	return sortedFiles;
}

function render(obj) {
	app.enableQE();
	var activeSequence = qe.project.getActiveSequence();	// we use a QE DOM function, to determine the output extension.

	if (activeSequence)	{
		app.encoder.launchEncoder();	// This can take a while; let's get the ball rolling.
		
		var projPath	= new File(app.project.path);

		if ((obj.exportPath) && projPath.exists){
			var outPreset = new File(obj.presetsPath + obj.presetValue + obj.presetExtension);

			if (outPreset.exists === true){
				var outputFormatExtension =	activeSequence.getExportFileExtension(outPreset.fsName);

				if (outputFormatExtension){
					var fullPathToFile	= 	obj.exportPath 	+ 
											getSep() 	+ 
											obj.sequenceName +
											"." + 
											outputFormatExtension;			

					var outFileTest = new File(fullPathToFile);

					if (outFileTest.exists){
						var destroyExisting	= confirm("A file with that name already exists; overwrite?", false, "Are you sure...?");
						if (destroyExisting){
							outFileTest.remove();
							outFileTest.close();
						}
					}

					// app.encoder.bind('onEncoderJobComplete',	onEncoderJobComplete);
					app.encoder.bind('onEncoderJobError', 		onEncoderJobError);
					// app.encoder.bind('onEncoderJobProgress', 	onEncoderJobProgress);
					app.encoder.bind('onEncoderJobQueued', 		onEncoderJobQueued);
					// app.encoder.bind('onEncoderJobCanceled',	onEncoderJobCanceled);


					// use these 0 or 1 settings to disable some/all metadata creation.
					app.encoder.setSidecarXMPEnabled(0);
					app.encoder.setEmbeddedXMPEnabled(0);
					
					var jobID = app.encoder.encodeSequence(	app.project.activeSequence,
															fullPathToFile,
															outPreset.fsName,
															app.encoder.ENCODE_WORKAREA, 
															1);	   // Remove from queue upon successful completion?					
					// message('jobID = ' + jobID);
					outPreset.close();
				}
			} else {
				updateEventPanel("Could not find output preset.");
			}
		} else {
			updateEventPanel("Could not find/create output path.");
		}
		projPath.close();
	} else {
		updateEventPanel("No active sequence.");
	}
}

function onEncoderJobComplete(jobID, outputFilePath) {
	var eoName;

	if (Folder.fs == 'Macintosh') {
		eoName = "PlugPlugExternalObject";							
	} else {
		eoName = "PlugPlugExternalObject.dll";
	}
			
	var suffixAddedByPPro	= '_1'; // You should really test for any suffix.
	var withoutExtension	= outputFilePath.slice(0,-4); // trusting 3 char extension
	var lastIndex			= outputFilePath.lastIndexOf(".");
	var extension			= outputFilePath.substr(lastIndex + 1);

	if (outputFilePath.indexOf(suffixAddedByPPro)){
		updateEventPanel(" Output filename was changed: the output preset name may have been added, or there may have been an existing file with that name. This would be a good place to deal with such occurrences.");
	}
			
	var mylib		= new ExternalObject('lib:' + eoName);
	var eventObj	= new CSXSEvent();

	eventObj.type	= "com.adobe.csxs.events.PProPanelRenderEvent";
	eventObj.data	= "Rendered Job " + jobID + ", to " + outputFilePath + ".";

	eventObj.dispatch();
}

function onEncoderJobError(jobID, errorMessage) {
	var eoName; 

	if (Folder.fs === 'Macintosh') {
		eoName	= "PlugPlugExternalObject";							
	} else {
		eoName	= "PlugPlugExternalObject.dll";
	}
			
	var mylib		= new ExternalObject('lib:' + eoName);
	var eventObj	= new CSXSEvent();

	eventObj.type	= "com.adobe.csxs.events.PProPanelRenderEvent";
	eventObj.data	= "Job " + jobID + " failed, due to " + errorMessage + ".";
	eventObj.dispatch();
}

function onEncoderJobProgress(jobID, progress) {
	message('onEncoderJobProgress called. jobID = ' + jobID + '. progress = ' + progress + '.');
}

function onEncoderJobQueued(jobID) {
	app.encoder.startBatch();
}

function onEncoderJobCanceled(jobID) {
	message('OnEncoderJobCanceled called. jobID = ' + jobID +  '.');
}

function message(msg) {
	$.writeln(msg);	 // Using '$' object will invoke ExtendScript Toolkit, if installed.
}

function updateEventPanel(message) {
	app.setSDKEventMessage(message, 'info');
	//app.setSDKEventMessage('Here is some information.', 'info');
	//app.setSDKEventMessage('Here is a warning.', 'warning');
	//app.setSDKEventMessage('Here is an error.', 'error');  // Very annoying; use sparingly.
}

function getDate(){
    var date = new Date();  
    var d  = date.getDate();  
    var day = (d < 10) ? '0' + d : d;  
    var m = date.getMonth() + 1;  
    var month = (m < 10) ? '0' + m : m;  
    var yy = date.getYear();  
    var year = (yy < 1000) ? yy + 1900 : yy;
	var currentDate = year+month+day;
    // alert(year+month+day);

	return currentDate;
}

function getTime(){
	// Get the time and format it  
	var currentTime = new Date();  
	var hours = currentTime.getHours();  
	var minutes = currentTime.getMinutes();  
	var seconds = currentTime.getSeconds();  

	if (minutes < 10) minutes = "0" + minutes;  
	if (seconds < 10) seconds = "0" + seconds;

	var currentTime = hours.toString()+minutes.toString()+seconds.toString();

	return currentTime;
}




