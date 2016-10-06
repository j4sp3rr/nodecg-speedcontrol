'use strict';
$(function () {
    // JQuery selector initialiation ###
    var $timerInfo = $('#timer');
    var $runnerInfoElements = $('div.runnerInfo');
    var $runnerTimerFinishedElements = $('.runnerTimerFinished')
    var $runnerTimerFinishedContainers = $('.runnerTimerFinishedContainer');
    var $runInformationSystem = $('#runInformationGameSystem');
    var $runInformationCategory = $('#runInformationGameCategory');
    var $runInformationEstimate = $('#runInformationGameEstimate');
    var $runInformationName = $('#runInformationGameName');
    var $runnerLogos = $('.runnerLogo');
    var $gameCaptures = $('.gameCapture');

    var currentTime = '';
    var displayTwitchforMilliseconds = 15000;
    var intervalToNextTwitchDisplay = 120000;
    var timeoutTwitch = null;

    // sceneID must be uniqe for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = $('html').attr('data-sceneid');

    // NodeCG Message subscription ###
    nodecg.listenFor("resetTime", resetAllPlayerTimers);
    nodecg.listenFor('timerReset', resetTimer);
    nodecg.listenFor('timerSplit', splitTimer);

    var stopWatchesReplicant = nodecg.Replicant('stopwatches');
    stopWatchesReplicant.on('change', function(oldVal, newVal) {
        if (!newVal) return;
        var time  = newVal[0].time || '88:88:88';
        if( oldVal )
        {
          $timerInfo.toggleClass('timer_'+oldVal[0].state,false);
        }
        $timerInfo.toggleClass('timer_'+newVal[0].state,true);
        setTime(time);
    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue !== 'undefined' && newValue != '' ) {
            updateSceneFields(newValue);
        }
    });

    var runDataActiveRunRunnerListReplicant = nodecg.Replicant("runDataActiveRunRunnerList");
    runDataActiveRunRunnerListReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue === 'undefined' || newValue == '') {
            return;
        }

        $runnerInfoElements.each( function( index, element ) {
            animation_setGameFieldAlternate($(this),getRunnerInformationTwitch(newValue,index));
        });

        $runnerLogos.each( function(index, element) {
			$(this).fadeOut(500, function() {
				$(this).removeClass('nameLogo').addClass('twitchLogo').fadeIn(500);
			});
        });

    });

    // Replicant functions ###

    // Changes the Game information text from the replicant, such as System, Category, Estimate and Game name
    function updateSceneFields(runData) {
        var runInfoGameName = runData.game;
        var runInfoGameEstimate = runData.estimate;
        var runInfoGameSystem = runData.system;
        var runInfoGameCategory = runData.category;

        animation_setGameField($runInformationSystem,runInfoGameSystem);
        animation_setGameField($runInformationCategory,runInfoGameCategory);
        animation_setGameField($runInformationEstimate,runInfoGameEstimate);
        animation_setGameField($runInformationName,runInfoGameName);
    }

    // Sets the current time of the timer.
    function setTime(timeHTML) {
        $timerInfo.html(timeHTML);
        currentTime = timeHTML;
    }

    // Gets the runner with index 'index' in the runnerarray's nickname from the rundata Replicant
    function getRunnerInformationName(runnerDataArray, index) {
        if(typeof runnerDataArray[index] === 'undefined') {
            console.log("Player nonexistant!");
            return "";
        }
        return runnerDataArray[index].names.international;
    }

    // Gets the runner with index 'index' in the runnerarray's twitch URL from the rundata Replicant
    function getRunnerInformationTwitch(runnerDataArray, index) {
        if(typeof runnerDataArray[index] === 'undefined') {
            console.log("Player nonexistant!");
            return "";
        }

        var twitchUrl = "";
        if (runnerDataArray[index].twitch != null &&
            runnerDataArray[index].twitch.uri != null) {
            twitchUrl = runnerDataArray[index].twitch.uri.replace("http://www.twitch.tv/","");
        }
        else {
            twitchUrl = runnerDataArray[index].names.international;
        }
		if (twitchUrl == "") {
			twitchUrl = runnerDataArray[index].names.international;
		}
        return twitchUrl;
    }

    // Timer functions ###

    function resetTimer(index) {
        $runnerTimerFinishedElements.eq(index).html("");
        hideTimerFinished(index);
    }

    function resetAllPlayerTimers() {
        $runnerTimerFinishedElements.each( function( index, element) {
          $(this).html("");
          hideTimerFinished(index);
        });
    }

    function splitTimer(index) {
        $runnerTimerFinishedElements.eq(index).html(currentTime);
        animation_fadeInOpacity($runnerTimerFinishedContainers.eq(index));
    }

    function displayTwitchInstead() {
        $runnerInfoElements.each(function(index,element) {
            animation_setGameFieldAlternate($(this), getRunnerInformationTwitch(runDataActiveRunRunnerListReplicant.value, index));
        });

        var tm = new TimelineMax({paused: true});
        $runnerLogos.each( function(index, element) {
			//animation_showZoomIn($(this));
			$(this).fadeOut(500, function() {
				$(this).removeClass('nameLogo').addClass('twitchLogo').fadeIn(500);
			});
        });

        tm.play();
        timeoutTwitch = setTimeout(hideTwitch,displayTwitchforMilliseconds);
    }

    function hideTwitch() {
        $runnerInfoElements.each( function(index,element) {
			animation_setGameFieldAlternate($(this), getRunnerInformationName(runDataActiveRunRunnerListReplicant.value, index));
        });

        $runnerLogos.each( function(index, element) {
			//animation_hideZoomOut($(this));
			$(this).fadeOut(500, function() {
				$(this).removeClass('twitchLogo').addClass('nameLogo').fadeIn(500);
			});
        });

        timeoutTwitch = setTimeout(displayTwitchInstead,intervalToNextTwitchDisplay);
    }

    function hideTimerFinished(index) {
        $runnerTimerFinishedContainers.eq(index).css("opacity","0");
    }

    function loadCSS (href) {
        var cssLink = $("<link rel='stylesheet' type='text/css' href='"+href+"'>");
        $("head").append(cssLink);
    };

    function convertToTrueAspectRatio(aspectRatioString) {
        var numbers = aspectRatioString.split(':');
        var realNumber = Number(numbers[0])/Number(numbers[1]);
        return realNumber;
    }

    function addCssRule(rule, css) {
        css = JSON.stringify(css).replace(/"/g, "").replace(/,/g, ";");
        $("<style>").prop("type", "text/css").html(rule + css).appendTo("head");
    }

    function getAspectRatio(input) {
        switch(input) {
            case 'GB':
            case 'GBC':
                return convertToTrueAspectRatio("10:9");
                break;
            case 'HD':
                return convertToTrueAspectRatio("16:9");
                break;
            case '3DSBottom':
            case 'SD':
            case 'DS':
                return convertToTrueAspectRatio("4:3");
                break;
            case '3DSTop':
                return convertToTrueAspectRatio("5:3");
                break;
            case 'GBA':
                return convertToTrueAspectRatio("3:2");
                break;
            default:
                var numbers = input.split(':');
                var realNumber = Number(numbers[0])/Number(numbers[1]);
                return realNumber;
        }
    }

    //
    // Layout initialization (runs once when the overlay loads)
    //

    $runnerTimerFinishedElements.each( function( index, e ){
        hideTimerFinished(index);
    });

    /*$runnerLogos.each( function(index, element) {
        $(this).css('transform', 'scale(0)');
    });*/

    $gameCaptures.each(function () {
        var aspectRatioMultiplier = getAspectRatio($(this).attr('aspect-ratio'));
        var height = 200;
        var width = height * aspectRatioMultiplier;
        addCssRule("#"+$(this).attr('id'), {
            width: width+"px",
            height: height+"px"
        });
    });

    loadCSS("/graphics/nodecg-speedcontrol/css/editcss/"+sceneID+".css");
});
