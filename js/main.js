$(document).ready(function () {
    'use strict';
    // alert('JS connected');

    //////////// PASS OBJECT TO JSX FOR EVALUATION ////////////
    // var passObjToJSX = new CSInterface();
    // var profileObj = {
    //     message: "ExendScript connected"
    // }
    // passObjToJSX.evalScript('parseObj(' + JSON.stringify(profileObj) + ')');


    //////////// GET VALUE FROM JSX ////////////
    // var getDirectory = new CSInterface();
    // getDirectory.evalScript('returnDirectory()',
    //     function(result){
    //         alert(result);
    //     }
    // );

    

    var csInterface = new CSInterface();


    window.onload = function(){
        var profileObj = {
            message: "ExendScript connected",
            sequenceName: '',
            presetsPath: '',
            presetFolder: '',
            presetValue: '',
            presetExtension: '.epr',
            exportPath: '',
            xmlPath: '/Users/sbaden/Desktop/XML/',   // HARDCODED LOCATION ON SERVER
            // xmlPath: '/Users/addison.coston/Desktop/XML/'
        }


        $('#input-sequence-name').click(clearCustomSeqName);

        function clearCustomSeqName(){
            $('#input-sequence-name').val('');
        }


        $('#input-sequence-name').focusout(checkValueCustomSeqName);

        function checkValueCustomSeqName(){
            var $textValue = $('#input-sequence-name');

            if($textValue.val() == ''){
                $textValue.val('Custom Sequence Name');
            }
        }


        $('#btn-export-path').click(getExportPath);

        function getExportPath(){
            csInterface.evalScript('returnDirectory()',
                function(result){
                    var $exportPathValue = $('#export-path-value');

                    if(result == 'undefined'){
                        $exportPathValue.html(profileObj.exportPath);
                    }
                    else{
                        profileObj.exportPath = result;
                        $exportPathValue.html(result);
                    }
                }
            );
        }




        $("#btn-process").click(processRequest);

        function processRequest(){
            if(profileObj.exportPath == ''){
                alert('Please select export path');
                return;
            }

            profileObj.presetValue = $('#preset-value').html();

            csInterface.evalScript('verifyDefaultPreset('+ JSON.stringify(profileObj) +')',
                function(result){
                  
                    if(result == 'true'){
                        csInterface.evalScript('returnActiveSequence()', 
                            function(result){
                                var $customSeqName = $('#input-sequence-name').val();
                                var $presetValue = $('#preset-value').html();

                                profileObj.presetValue = $presetValue;

                                switch($customSeqName){
                                    case 'Custom Sequence Name':
                                    case '':
                                    case null:
                                    case undefined:
                                        profileObj.sequenceName = result;
                                        break;

                                    default:
                                        profileObj.sequenceName = $.trim($customSeqName);
                                        break;
                                }

                                // PASS OBJECT TO JSX
                                csInterface.evalScript('parseObj(' + JSON.stringify(profileObj) + ')');

                                // CLEAR CUSTOM SEQUENCE NAME - CLEAN UP
                                $('#input-sequence-name').val('Custom Sequence Name');
                            }
                        );
                    }
                    else{ alert('The selected preset can not be found.'); }
                }
            );

        }


        $("#btn-refresh-preset").click(getPresets);

        function getPresets(){
            $('#input-sequence-name').val('Custom Sequence Name');
            $('#preset-value').html('NFL PRORESLT STEREO');
            $("#preset-list").empty();

            csInterface.evalScript('getPresetPath()',
                function(result){
                    result = JSON.parse(result);

                    if(result){
                        profileObj.presetsPath = '/Users/' + result.userName + '/Documents/Adobe/Adobe Media Encoder/' + result.versionFolder + '/Presets/';

                        csInterface.evalScript('getFiles('+ JSON.stringify(profileObj.presetsPath) +')',
                            function(result){
                                result = result.split(',');
                            
                                for(var i = 0; i< result.length; i++){
                                    $("#preset-list").append('<li><a href="#">' + result[i] + '</a></li>');
                                }
                            }
                        );
                    }
                }
            );

        }


        $('#preset-list').on('click', 'li', function() {
            var $presetIndex = $(this).index();
            var $presetValue = $(this).text();

            $('#preset-value').html($presetValue);
        });


        $('.list').click(function(){
            $(this).toggleClass('tap');
        });



        getPresets();






        ///////////////////////////////////////////////
        // TEMP BUTTON FOR DEV: RELOADS EXTENTION PANEL
        // $("#btn-reload").click(reloadPanel);

        // function reloadPanel() {
        //     location.reload();
        // }

    }

}());
    
