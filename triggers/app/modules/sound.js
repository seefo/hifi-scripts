/*
//  sound.js
//
//  Created by Robbie Uvanni on 2017-07-17
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
*/

/*
  userdata.properties:
    audio_url
    
   userdata.extra_objects:
    "Audio Player"
*/

module.exports.onEnter = function(userdata) {
  var pos = Entities.getEntityProperties(userdata.extra_objects["Audio Player"], ["position"]).position;
  var sound = SoundCache.getSound(userdata.properties.audio_url);
  
  Audio.playSound(sound, { position: pos, localOnly: false });
}