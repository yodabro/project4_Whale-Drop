var app = angular.module('whaleDrop',[]);
var id = "";

app.controller('whaleDropController', ["$http", "$scope", "$sce", function($http, $scope, $sce){
  $scope.loggedIn = id;

  // display toggles
  this.hideTracks = true;
  this.hideEdit = true;
  this.hidePlaylist = true;

  // tracks variables
  $scope.songUrls = {};
  this.songData = {};

  // editor variables
  this.waveForm = "";
  this.currentTitle = "";
  this.currentSongId;
  this.currentSongLength;
  this.currentSongImage;
  this.startTime;
  this.endTime;

  // initialize to edges
  this.leftCutStyle = 0;
  this.rightCutStyle = 0;

  // playlist variables
  this.currentPlaylist = [];
  this.currentSongUrls = {};
  this.currentSongImgs = {};
  this.currentSongTitles = {};
  this.playlistAudioElements;
  this.currentPlaying;

  var controller = this;

  $scope.getAudioUrl = function(url) {
    //required function to use with ng-src on iframe and audio elements
    return $sce.trustAsResourceUrl(url);
  };


  this.tracks = function () {
    $http.get('/tracks')
         .success(function (data) {
           // loop through the songs and push them into the array to be displayed in the dom
           for(var i = 0; i < data.songs.length; i++) {
             // makes sure the song is streamable
             // otherwise it won't show up in the playlist after cropping
             if(data.songs[i].streamable) {
               controller.songData = data;
               $scope.songUrls[i] = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/" + data.songs[i].id + "&amp;auto_play=false&amp;hide_related=true&amp;show_comments=false&amp;buying=false&amp;sharing=false&amp;liking=false&amp;show_user=true&amp;show_reposts=false&amp;visual=false";
             }
           }
           controller.hideTracks = false;
           controller.hidePlaylist = true;
           controller.hideEdit = true;
         })
  }

  this.editTrack = function (keyInSongData) {
    controller.hideEdit = false;
    controller.hideTracks = true;

    controller.currentTitle = controller.songData.songs[keyInSongData].title;
    controller.waveForm = controller.songData.songs[keyInSongData].waveform_url;
    controller.currentSongUrl = controller.songData.songs[keyInSongData].uri + '/stream?client_id=0674959b82266a752b735a587f607e1c';
    controller.currentSongImage = controller.songData.songs[keyInSongData].artwork_url;

    $('#right-divider').css('right', 0);
    controller.currentSongLength = controller.songData.songs[keyInSongData].duration;

    controller.startTime = 0;
    controller.endTime = controller.currentSongLength;

    controller.currentSongId = controller.songData.songs[keyInSongData].id;
  }

  this.toggleDragTarget = function ($event, target) {
    if (controller.dragTarget) {
      controller.dragTarget = undefined;
    } else {
      controller.dragTarget = target;
    }
  }

  this.updateSampleSize = function ($event) {
    var x = $event.offsetX;
    var toolWidth = $('#sample-tool').width();
    var percent = x / toolWidth;

    if (controller.dragTarget === 'left-divider') {
      $('#left-divider').css('left', x);
      $('#left-cut').css('width', x);
      controller.startTime = percent * controller.currentSongLength;
    } else if (controller.dragTarget === 'right-divider') {
      $('#right-divider').css('left', x);
      $('#right-cut').css('width', toolWidth - x);
      controller.endTime = percent * controller.currentSongLength;
    }

    // missing: left should never be to the right of right.
    // also: I shouldn't leave the container, but that might not need extra checks


    // var time = some function of percent...


  }

  this.createCrop = function () {
    var song = {
      songId : controller.currentSongId,
      title : controller.currentTitle,
      imageUrl : controller.currentSongImage,
      start : controller.startTime,
      end : controller.endTime
    };
    $http.post('/addtoplaylist', { song : song })
    .success(function (data) {
      controller.hidePlaylist = false;
      controller.hideEdit = true;
      controller.hideTracks = true;
      controller.playlist();
    })
  }

  this.playlist = function () {
    $http.get('/playlist')
         .success(function (data) {
           console.log(data);
           controller.hidePlaylist = false;
           controller.hideEdit = true;
           controller.hideTracks = true;
           controller.currentPlaylist = data.playlist;

           for(var songIndex = 0; songIndex < data.playlist.length; songIndex++) {
             controller.currentSongUrls[songIndex] = "https://api.soundcloud.com/tracks/" + data.playlist[songIndex].songId + "/stream?client_id=0674959b82266a752b735a587f607e1c";
             controller.currentSongImgs[songIndex] = data.playlist[songIndex].imageUrl;
             controller.currentSongTitles[songIndex] = data.playlist[songIndex].title;
           }

           $scope.playlistStartTime();

         })
  }

  $scope.deleteThis = function (songIndex) {
    $http.delete('/delete', { songIndex : songIndex })
         .success(function (data) {
           controller.playlist();
         })
  }

  $scope.playlistPlay = function ($event) {
    controller.playlistAudioElements = $('audio');

    for(var i = 0; i < controller.playlistAudioElements.length; i++) {
      (function(i) {
        controller.playlistAudioElements[0].play();
        setTimeout(function () {
          controller.playlistAudioElements[i].pause();
          if(controller.playlistAudioElements[i + 1]) {
            controller.playlistAudioElements[i + 1].play();
          }
        }, controller.playlistAudioElements[i].dataset.end - controller.playlistAudioElements[i].dataset.start)
      }(i))
    }
  }

  $scope.playlistStartTime = function () {
    var myAudio = [];
    var setSource = function () {
      for(var i = 0; i < myAudio.length; i++){
        (function(i) {
          setTimeout(function(){
            currentAudioElement = myAudio[i];
            currentAudioElement.src = $scope.getAudioUrl("https://api.soundcloud.com/tracks/" + controller.currentPlaylist[i].songId + "/stream?client_id=0674959b82266a752b735a587f607e1c");

            currentAudioElement.oncanplaythrough = setTimeout(function () {
              setTime();
              if (i === myAudio.length - 1) {
                $scope.playlistPlay();
              }
            }, 500);

            function setTime(){
              currentAudioElement.currentTime = currentAudioElement.dataset.start / 1000;
            }
          }, 1000 * i);
        }(i));
      }
    }
    setTimeout(function () {
      myAudio = document.querySelectorAll('audio');
      setSource();
    }, 200);
  }

}]);
