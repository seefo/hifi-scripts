/*
//  hackySack.js
//
//  Created by Robbie Uvanni on 2017-07-24
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
*/

(function() {
    var HACKY_SACK_NAME = "HackySack Ball";
    var HACKY_SACK_COLLIDER_NAME = "HackySack Collider";
    var HACKY_SACK_FLOOR_NAME = "Floor";
    var HACKY_SACK_CHANNEL_NAME = "com.highfidelity.hackysack";
    var HACKY_SACK_MESSAGE_PREFIX = "[Hacky Sack] ";
    
    var _this;
    var serverID = "";
    var dropped = false;
    
    function getNameForEntity(entityID) {
        return Entities.getEntityProperties(entityID, ["name"]).name;
    }

    function getOwnerIDForEntity(entityID) {
        var userdata = JSON.parse(Entities.getEntityProperties(entityID, ["userData"]).userData);
        return userdata.ownerID;
    }
    
    function getHackySackServerID() {
        var userdata = JSON.parse(Entities.getEntityProperties(_this.entityID, ["userData"]).userData);
        return userdata.hackySackServerID;
    }
    
    function getMessageForHit(hitter) {
        return {
            "id" : _this.entityID,
            "type": "hit",
            "hitter": hitter
        };
    }
    
    function getMessageForDropped() {
        return {
            "id" : _this.entityID,
            "type": "dropped"
        };
    }
    
    Messages.messageReceived.connect(function(channel, message, sender) {
        try {
			var data = JSON.parse(message);
        } catch (e) { 
			return; 
        }
        
        if (channel !== HACKY_SACK_CHANNEL_NAME) {
            return;
        }
        
        if (data.id !== serverID) {
            // print(HACKY_SACK_MESSAGE_PREFIX + "Dropping message due to server ID mismatch: got " + data.id + ", expected " + serverID);
            return;
        }
    
        switch (data.type) {
            case "reset":
                dropped = false;
                break;
                
            default:
                print(HACKY_SACK_MESSAGE_PREFIX + "Unknown message type received: " + data.type);
                break;
        }
    });

    function hackySack() {
        _this = this;
    }
    
    hackySack.prototype = {
        preload: function(id) {
            _this.entityID = id;
            serverID = getHackySackServerID();
            Messages.subscribe(HACKY_SACK_CHANNEL_NAME);
        },
        
        unload: function() { },
        
        collisionWithEntity: function(entA, entB, collision) {
            // swap the order if the collision was the other way
            if (getNameForEntity(entA) === HACKY_SACK_COLLIDER_NAME) {
                var temp = entA;
                entA = entB;
                entB = temp;
            }
            // alert hackysack server of potential collision
            if (getNameForEntity(entA) === HACKY_SACK_NAME && !dropped) {
                switch (getNameForEntity(entB)) {
                    case HACKY_SACK_COLLIDER_NAME:
                        var hitter = getOwnerIDForEntity(entB);
                        Messages.sendMessage(HACKY_SACK_CHANNEL_NAME, JSON.stringify(getMessageForHit(hitter)));
                        break;
                        
                    case HACKY_SACK_FLOOR_NAME:
                        dropped = true;
                        Messages.sendMessage(HACKY_SACK_CHANNEL_NAME, JSON.stringify(getMessageForDropped())); 
                        break;
                }
            }
        }
    };

    return new hackySack();
});