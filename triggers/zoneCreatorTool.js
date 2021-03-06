/*
// zoneCreatorTool.js
//
// Created by Robbie Uvanni on 2017-07-17
// Copyright 2017 High Fidelity, Inc.
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
*/

(function() {
    var APP_NAME = "ZONE EDITOR";
    var APP_URL = Script.resolvePath("./app/hud/app.html");
    var APP_ICON = Script.resolvePath("./app/hud/images/icon.png");
    
    var ZONE_TRIGGER_CHANNEL = "zoneTriggers";
    var ZONE_TRIGGER_MODEL = "http://hifi-content.s3.amazonaws.com/alan/dev/trigger-cube-glow.fbx";
    var ZONE_TRIGGER_COLLISION_MODEL = "http://content.highfidelity.com/DomainContent/production/welcomeWagon/ghostWagon-Cube.obj";
    var ZONE_TRIGGER_SPAWN_OFFSET = { x: 0.0, y: 0.3, z: -1.0 };
    var ZONE_TRIGGER_SPAWN_EXTRA_OBJECTS_OFFSET = { x: 0.0, y: 0.0, z: 0.0 };

    var actions = Script.require('./app/actions.json');
    var triggerScript = Script.resolvePath("./app/trigger.js");
    
    var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");
    var button = tablet.addButton({
        text: APP_NAME,
        icon: APP_ICON
    });
 
    function clicked(){
        tablet.gotoWebScreen(APP_URL);
        tablet.emitScriptEvent(JSON.stringify({
            type: ZONE_TRIGGER_CHANNEL,
            data: actions
        })); 
    }
    
    function cleanup() {
        tablet.removeButton(button);
    }
    
    function createTrigger(customizedTrigger) {
        var relativeOffset = Vec3.multiplyQbyV(MyAvatar.orientation, ZONE_TRIGGER_SPAWN_OFFSET);
        var spawnPosition = Vec3.sum(MyAvatar.position, relativeOffset);
        var extraObjectPosition = Vec3.sum(spawnPosition, ZONE_TRIGGER_SPAWN_EXTRA_OBJECTS_OFFSET);
        
        // move spawn position so that the zone touches the floor
        spawnPosition.y -= (MyAvatar.scale / 2);
        
        // if we were given extra objects to spawn, we should go ahead and do those
        if (typeof customizedTrigger.extra_objects !== "undefined") {
            var extraObjectProperties = {
                "type": 'Box',
                "shapeType": 'box',
                "color": { "blue": 0, "green": 0, "red": 255 }
            };
            
            var newExtraObjects = { };
        
            for (var i = 0; i < customizedTrigger.extra_objects.length; i++) {
                extraObjectPosition.y -= 0.25;
                
                var extraObject = customizedTrigger.extra_objects[i];
                extraObjectProperties.name = extraObject.name;
                extraObjectProperties.description = extraObject.description;
                extraObjectProperties.position = extraObjectPosition;
                
                newExtraObjects[extraObject.name] = Entities.addEntity(extraObjectProperties);
            }
            
            // replace our descriptions of extra objects to be the spawned extra objects
            customizedTrigger.extra_objects = newExtraObjects;
        }
        
        var triggerProperties = {                                 
            "name": "Zone Trigger",
            "description": "Created via Zone Editor tool",
            "position": spawnPosition,                    

            "type": "Model",
            "modelURL": ZONE_TRIGGER_MODEL,
            "dimensions": { x: 1.0, y: MyAvatar.scale * 2, z: 1.0 },
            
            "shapeType": "compound",
            "compoundShapeURL": ZONE_TRIGGER_COLLISION_MODEL,
            "collisionless": 1,
            "ignoreForCollisions": 1,
            
            "script" : triggerScript,
            "userData": JSON.stringify(customizedTrigger)
        };

        Entities.addEntity(triggerProperties);
    }
 
    function onWebEventReceived(event) {
        // tablet is letting us know they're ready
        if (event === "Document Ready") {
            tablet.emitScriptEvent(JSON.stringify({
                type: ZONE_TRIGGER_CHANNEL,
                reason:'sendTriggerTypes',
                data: actions
            })); 
        // event wasn't deserialized so we should do so now
        } else if (typeof event === "string") {
            event = JSON.parse(event);
        }

        // process custom events
        if (event.type === ZONE_TRIGGER_CHANNEL) {
            switch (event.reason) {
                case 'createTrigger':
                    createTrigger(event.data);
                    break;
                    
                default:
                    print('Unknown web event: ' + event.reason);
                    break;
            }
        }
    }
    
    button.clicked.connect(clicked);
    Script.scriptEnding.connect(cleanup);
    tablet.webEventReceived.connect(onWebEventReceived);
}());