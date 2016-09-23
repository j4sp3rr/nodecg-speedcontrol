'use strict';
$(function () {
    // JQuery selector initialiation ###

    var $comingUpGame = $('#comingUpGame');
    var $comingUpCathegory = $('#comingUpCathegory');
    var $comingUpSystem = $('#comingUpSystem');
	var $comingUpPlayer = $('#comingUpPlayer');

    var $justMissedGame = $('#justMissedGame');
    var $justMissedCathegory = $('#justMissedCathegory');
    var $justMissedSystem = $('#justMissedSystem');
    var $justMissedPlayer = $('#justMissedPlayer');

	var $runnerInfoElements = $('div.runnerInfo');
	var $runnerLogos = $('.runnerLogo');

    var isInitialized = false;
	var displayTwitchforMilliseconds = 15000;
    var intervalToNextTwitchDisplay = 120000;
    var timeoutTwitchJustMissed = null;
    var timeoutTwitchComingUp = null;

    // sceneID must be uniqe for this view, it's used in positioning of elements when using edit mode
    // if there are two views with the same sceneID all the elements will not have the correct positions
    var sceneID = $('html').attr('data-sceneid');

    // NodeCG Message subscription ###
    nodecg.listenFor("displayMarqueeInformation", displayMarquee);
    nodecg.listenFor("removeMarqueeInformation", removeMarquee);

	nodecg.listenFor("forceRefreshIntermission", function() {
		isInitialized = false;

        if(typeof runDataActiveRunReplicant.value == 'undefined' || runDataActiveRunReplicant.value == "") {
            //return;
        }

        var indexOfCurrentRun = findIndexInDataArrayOfRun(runDataActiveRunReplicant.value, runDataArrayReplicant.value);
        var indexOfNextRun = Number(indexOfCurrentRun) + Number(1);
        var comingUpRun = undefined;
        if(indexOfNextRun >= runDataArrayReplicant.value.length) {
        }
        else {
            comingUpRun = runDataArrayReplicant.value[indexOfNextRun];
        }
        if(!isInitialized) {
            updateMissedComingUp(runDataActiveRunReplicant.value, comingUpRun);
            isInitialized = true;
        }
	});

    // Replicants ###
    var sceneLayoutConfigurationReplicant = nodecg.Replicant('sceneLayoutConfiguration');
    sceneLayoutConfigurationReplicant.on('change', function(oldVal, newVal) {
        if(typeof newValue !== 'undefined' && newValue != "") {
            applyBackgroundTransparence(newVal.backgroundTransparency);
            handleEditMode(newVal.editMode)
        }
    });

    var runDataArrayReplicant = nodecg.Replicant("runDataArray");
    runDataArrayReplicant.on("change", function (oldValue, newValue) {
    });

    var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
    runDataActiveRunReplicant.on("change", function (oldValue, newValue) {
        if(typeof newValue == 'undefined' || newValue == "") {
            //return;
        }

        var indexOfCurrentRun = findIndexInDataArrayOfRun(newValue, runDataArrayReplicant.value);
        var indexOfNextRun = Number(indexOfCurrentRun) + Number(1);
        var comingUpRun = undefined;
        if(indexOfNextRun >= runDataArrayReplicant.value.length) {
        }
        else {
            comingUpRun = runDataArrayReplicant.value[indexOfNextRun];
        }
        if(!isInitialized) {
            updateMissedComingUp(newValue, comingUpRun);
            isInitialized = true;
        }
    });


    function findIndexInDataArrayOfRun(run, runDataArray) {
        var indexOfRun = -1;
        $.each(runDataArray, function (index, value) {
			if (value && run && value.runID == run.runID) {
                indexOfRun = index;
            }
        });
        return indexOfRun;
    }

    function updateMissedComingUp(currentRun, nextRun) {
        changeComingUpRunInformation(nextRun);
        changeJustMissedRunInformation(currentRun);

		$runnerLogos.each( function(index, element) {
			$(this).fadeOut(500, function() {
				$(this).removeClass('nameLogo').addClass('twitchLogo').fadeIn(500);
			});
        });
    }

    // Replicant functions ###
    function changeComingUpRunInformation(runData) {
        var game = "END";
        var category = "";
        var system = "";
		var player = "";
		var playerTwitch = ""
		var playerArray = [];
		var playerTwitchArray = [];

        if(typeof runData !== "undefined" && runData !== '') {
            game = runData.game;
            category =  runData.category;
            system = runData.system;
			for (var i = 0; i < runData.players.length; i++) {
				playerArray.push(runData.players[i].names.international);
				playerTwitchArray.push(getRunnerInformationTwitch(runData.players[i]));
			}
			player = playerArray.join(', ');
			playerTwitch = playerTwitchArray.join(', ');
        }

        animation_setGameField($comingUpGame,game);
        animation_setGameField($comingUpCathegory,category);
        animation_setGameField($comingUpSystem,system);
        animation_setGameFieldAlternate($comingUpPlayer,playerTwitch);

    }

    function changeJustMissedRunInformation(runData) {
        var game = "START";
        var category = "";
        var system = "";
		var player = "";
		var playerTwitch = ""
		var playerArray = [];
		var playerTwitchArray = [];

        if(typeof runData !== "undefined" && runData !== '') {
            game = runData.game;
            category =  runData.category;
            system = runData.system;
			for (var i = 0; i < runData.players.length; i++) {
				playerArray.push(runData.players[i].names.international);
				playerTwitchArray.push(getRunnerInformationTwitch(runData.players[i]));
			}
			player = playerArray.join(', ');
			playerTwitch = playerTwitchArray.join(', ');
        }

        animation_setGameField($justMissedGame,game);
        animation_setGameField($justMissedCathegory,category);
        animation_setGameField($justMissedSystem,system);
        animation_setGameFieldAlternate($justMissedPlayer,playerTwitch);
    }

	function getRunnerInformationTwitch(runData) {
        var twitchUrl = "";
        if (runData.twitch != null &&
            runData.twitch.uri != null) {
            twitchUrl = 'twitch.tv/' + runData.twitch.uri.replace("http://www.twitch.tv/","");
        }
        else {
            twitchUrl = runData.names.international;
        }
		if (twitchUrl == "") {
			twitchUrl = runData.names.international;
		}
        return twitchUrl;
    }

	function displayTwitchInstead(justMissed, $element, player, playerTwitch) {
        animation_setGameFieldAlternate($element, playerTwitch);

        var tm = new TimelineMax({paused: true});
		if (!justMissed) {
			$runnerLogos.each( function(index, element) {
				//animation_showZoomIn($(this));
				$(this).fadeOut(500, function() {
					$(this).removeClass('nameLogo').addClass('twitchLogo').fadeIn(500);
				});
			});
		}

        tm.play();
		if (justMissed) {timeoutTwitchJustMissed = setTimeout(function() {hideTwitch(justMissed, $element, player, playerTwitch)},displayTwitchforMilliseconds);}
		else {timeoutTwitchComingUp = setTimeout(function() {hideTwitch(justMissed, $element, player, playerTwitch)},displayTwitchforMilliseconds);}

    }

	function hideTwitch(justMissed, $element, player, playerTwitch) {
        animation_setGameFieldAlternate($element, player);

		if (!justMissed) {
			$runnerLogos.each( function(index, element) {
				//animation_hideZoomOut($(this));
				$(this).fadeOut(500, function() {
					$(this).removeClass('twitchLogo').addClass('nameLogo').fadeIn(500);
				});
			});
		}

        if (justMissed) {timeoutTwitchJustMissed = setTimeout(function() {displayTwitchInstead(justMissed, $element, player, playerTwitch)},intervalToNextTwitchDisplay);}
		else {timeoutTwitchComingUp = setTimeout(function() {displayTwitchInstead(justMissed, $element, player, playerTwitch)},intervalToNextTwitchDisplay);}
    }

    // General functions ###

    function applyBackgroundTransparence(value) {
        if (value == 'On') {
            $('#window-container').css('opacity',0.5);
        }
        else if (value == 'Off') {
            $('#window-container').css('opacity',1.0);
        }
    }

    function displayMarquee(text) {
        $('#informationMarquee').html(text);
		$('#informationMarquee').css('opacity', '1');
        var tm = new TimelineMax({paused: true});
        tm.to($('#informationMarquee'), 1.0, {opacity: '1', top: "1021px",  ease: Bounce.easeOut },'0');
        tm.play();
    }

    function removeMarquee() {
        var tm = new TimelineMax({paused: true});
        tm.to($('#informationMarquee'), 1.0, {opacity: '1', top: "1080px",  ease: Bounce.easeOut , onComplete:function() {
			$('#informationMarquee').css('opacity', '0');
		}},'0');
        tm.play();
    }

    function loadCSS (href) {
        var cssLink = $("<link rel='stylesheet' type='text/css' href='"+href+"'>");
        $("head").append(cssLink);
    };

    loadCSS("/graphics/nodecg-speedcontrol/css/editcss/"+sceneID+".css");
});
