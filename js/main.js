// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '640',
    width: '900',
    videoId: '0N9McnK2kh0',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

var videoTime = 0;
var timeUpdater = null;
var showingBoard = false;
var justShowedBoard = false;
// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  // event.target.playVideo();
  function updateTime() {
    var oldTime = videoTime;
    if(player && player.getCurrentTime) {
      videoTime = player.getCurrentTime();
    }
    if(videoTime !== oldTime) {
      onProgress(videoTime);
    }
  }
  timeUpdater = setInterval(updateTime, 100);
}

// when the time changes, this will be called.
function onProgress(currentTime) {
  console.log(currentTime);
  if(currentTime >= 129 && currentTime < 130 && !showingBoard && !justShowedBoard) {
    console.log("Trigger");
    triggerScenePizza();
  }
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {
    // setTimeout(triggerScenePizza, 6000);
    done = true;
  } else if (event.data == YT.PlayerState.ENDED) {
    setTimeout(triggerScenePractice, 0);
  }
}
function playVideo() {
  player.playVideo();
}
function pauseVideo() {
  player.pauseVideo();
}

function hideBoard() {
  $('.scene').hide();
  $('#board').hide();
  showingBoard = false;
  setTimeout(function () {
    justShowedBoard = false;
  }, 2000);
}
function showBoard() {
  $('.scene').hide();
  $('#board').show();
  showingBoard = true;
  justShowedBoard = true;
}

function startScene(scene) {
  $(scene).fadeIn(function () {
    pauseVideo(); // For sure
  });
}
function continueScene(el) {
  var next = $(el).data('next');
  console.log(next);
  $(el).parent('.scene').fadeOut(function () {
    $(next).fadeIn(function () {
      if (next.includes('scene-timer')) {
        document.getElementById('sound').play();
        setTimeout(continueScene, 4000, $(next).find('.btn-continue'));
      } else if (next.includes('scene-end')) {
        document.getElementById('ending').play();
      }
    });
  });
}
function endScene(el) {
  $(el).parent('.scene').fadeOut(function () {
    hideBoard();
    playVideo();
  });
}
function jumpScene(el) {
  var to = $(el).data('to');
  console.log(to);
  $(el).closest('.scene').fadeOut(function () {
    $(to).fadeIn();
  });
}
function showScene(target) {
  var $scene = $('.scene:visible');
  if ($scene.length == 0) {
    console.log('SHOW', target);
    $(target).show();
  } else {
    $('.scene:visible').fadeOut(function () {
      console.log('FADE IN', target);
      $(target).fadeIn();
    });
  }
}

function triggerScenePizza() {
  pauseVideo();
  showBoard();
  startScene('#scene-title-pizza');
}
function triggerScenePractice() {
  showBoard();
  startScene('#scene-title-practice');
}
function triggerSceneEnd() {
  showBoard();
  startScene('#scene-end');
}

function showSceneByStatus(status) {
  var scenes = [
    'join',
    'joined',
    'learned',
    'discussed',
    'practiced',
    'taught',
    'quizzed'
  ];
  showScene('#scene-' + scenes[status]);
}

// Auth Functions

function login(email, password) {
  firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log('LOGIN', errorCode, errorMessage);
  });
}

function signup(email, password) {
  firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log('SIGNUP', errorCode, errorMessage);
  });
}

function logout() {
  firebase.auth().signOut().then(function() {
    // Sign-out successful.
    console.log('LOGOUT');
  }).catch(function(error) {
    // An error happened.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log('LOGOUT', errorCode, errorMessage);
  });
}

function isLoggedIn() {
  return !!firebase.auth().currentUser;
}

// Firestore Functions

function getUser(uid, success, fail) {
  var db = firebase.firestore();
  var userRef = db.collection('users').where('uid', '==', uid);
  userRef.get().then(function(doc) {
    console.log(doc);
    if (!doc.empty) {
      console.log("Document data:", doc.docs);
      success(doc.docs[0].data());
    } else {
      console.log("No such document!");
      fail();
    }
  }).catch(function(error) {
    console.log("Error getting document:", error);
  });
}

function initUser(auth) {
  console.log('USER ADD', auth.uid);
  var db = firebase.firestore();
  db.collection('users').add({
    uid: auth.uid,
    email: auth.email,
    status: 0
  }).then(function(docRef) {
    console.log('Document written with ID:', docRef.id);
  }).catch(function(error) {
    console.error('Error adding document:', error);
  });
}

$(document).ready(function () {
  showBoard();
  $('#scene-blank').show();

  // Global Events
  $('.btn-continue').click(function () {
    if (!$(this).hasClass('btn-disabled')) {
      continueScene(this);
    }
  })
  $('.btn-jump').click(function () {
    jumpScene(this);
  })
  $('.btn-end').click(function () {
    endScene(this);
  })
  $('.btn-share').click(function () {
    var url = "https://polarischen.github.io/tol-glasses/";
    var text = "Do you know how glasses work? Check this out! 😎";
    var twitterWindow = window.open('https://twitter.com/share?url=' + url + '&text=' + text, 'twitter-popup', 'height=350, width=600');
    if (twitterWindow.focus) {
      twitterWindow.focus();
    }
  })
  $('.select .option').click(function () {
    var $select = $(this).parent('.select');
    if (!$select.hasClass('select-disabled')) {
      $select.find('.option').removeClass('option-selected');
      $(this).addClass('option-selected');

      var $btn = $select.parent('.scene').find('.btn-continue');
      $btn.removeClass('btn-disabled');

      var next = $(this).data('next');
      if (next) {
        var target = $select.data('target');
        var $btnTarget = $(target).find('.btn-continue');
        $btnTarget.data('next', next);
      }
    }
  })
  $('.input-answer').on('change keyup paste', function() {
    var $btn = $(this).parent('.scene').find('.btn-continue');
    if ($(this).val().length === 0) {
      $btn.addClass('btn-disabled');
    } else {
      $btn.removeClass('btn-disabled');
    }
  })

  $('#btn-login').click(function () {
    var email = $('#input-login-email').val();
    var password = $('#input-login-password').val();
    console.log('LOGIN', email, password);
    login(email, password);
  })
  $('#btn-signup').click(function () {
    var email = $('#input-signup-email').val();
    var password = $('#input-signup-password').val();
    console.log('SIGNUP', email, password);
    signup(email, password);
  })
  $('#btn-logout').click(function () {
    logout();
  })

  $('.btn-start').click(function () {
    console.log('START');
    if (isLoggedIn()) {
      showScene('#scene-join');
    } else {
      showScene('#scene-login');
    }
  })

  // Listen user state change
  firebase.auth().onAuthStateChanged(function(auth) {
    if (auth) {
      // User is logged in
      console.log('AUTH', auth);
      // Check User
      getUser(auth.uid, function(user) {
        // Check Status
        console.log('CHECK STATUS', user);
        showSceneByStatus(user.status);
      }, function() {
        console.log('INIT USER');
        addUser(auth);
        showSceneByStatus(0);
      });

    } else {
      // No user is logged in
      console.log('AUTH NULL');
      showScene('#scene-start');
    }
  });
})
