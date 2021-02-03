/**
 * Variables declaration
 */

var addButton = document.getElementById('add_event_button'); //Add event (red) button
var form = document.getElementById("new_event_form");
var formTitle = document.getElementById("myModalLabel");
var title_input = document.getElementById('floatingInput_title')
var des_input = document.getElementById('floatingInput_Description')
var select_input = document.getElementById('event_select');
var lonlat_input = document.getElementById('event_lonlat');
var saveButton = document.getElementById("saveButton");
var color = document.getElementById("event_select").style.borderColor;
var stroke = document.getElementById("event_select").style.borderWidth;

var fireCode = 1;
var floodCode = 2;
var plagueCode = 3;

var fireColor = "red";
var floodColor = "blue";
var plagueColor = "green";

var singleUri = "/event/";
var multipleUri = "/events";

var createMethod = "POST";
var updateMethod = "PUT";
var deleteMethod = "DELETE";
var queryMethod = "GET";


/**
 * set the nav buttons
 */
document.getElementById('nav_map').className = 'nav-item active';
document.getElementById('nav_home').className = 'nav-item';

/**
 * Convert the event type to a color
 * @param {EventType} type 
 */
function getColorByEventType(type) {
    if (type == 1)
        return "red";
    else if (type == 2)
        return "blue";
    else if (type == 3)
        return "green";
    else
        return "black";
}

/**
 * Get the name of the EventType var
 * @param {EventType} type 
 */
function getNameByEventType(type) {
    if (type == 1)
        return "Fire";
    else if (type == 2)
        return "Flood";
    else if (type == 3)
        return "Plague";
    else
        return "Unknown";
}

/**
 * get the latitude easy
 * @param {LatLon} latlon var of the Mapbox api
 */
function getLatitude(latlon) {
    if (latlon && latlon.indexOf(",") > 0)
        return latlon.split(",")[0];
    else
        return "-1";
}

/**
 * get the longtitude easy
 * @param {LatLon} latlon var of the Mapbox api
 */
function getLongtitude(latlon) {
    if (latlon && latlon.indexOf(",") > 0)
        return latlon.split(",")[1];
    else
        return "-1";
}


/**
 * A class for the event datatype
 * 
 * The class allows you to assign the event parameters and to convert them to JSON for example
 */
class EventClass {
    //CTOR
    constructor(event_id, title, description, event_type, lon, lat) {
        this.event_id = event_id;
        this.title = title;
        this.description = description;
        this.eventType = event_type;
        this.lon = lon;
        this.lat = lat;
    }

    /**
     * Get the event data from a JSON object
     * @param {JSON} json 
     */
    fromJson(json) {
        this.event_id = json['id'];
        this.title = json['title'];
        this.description = json['description'];
        this.eventType = json['type'];
        this.lon = json['lon'];
        this.lat = json['lat'];
    }

    /**
     * get the event's color 
     */
    getMyColor() {
        var result = getColorByEventType(this.eventType);

        return result;
    }

    getId() {
        return this.event_id;
    }

    getMyTypeName() {
        switch (this.eventType) {
            case fireCode:
                return "FIRE";
            case floodCode:
                return "FLOOD";
            case plagueCode:
                return "PLAGUE";
            default:
                return "Unknown";
        }
    }

    asJson() {
        var js = '{ "id" :' + this.event_id + ', "title" : "' + this.title +
            '", "description" : "' + this.description + '", "type" :' + this.eventType +
            ', "lon" : ' + this.lon + ', "lat" : ' + this.lat + '}';

        return JSON.parse(js);
    }

    asGeoJsonObject() {
        var js = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    this.lon,
                    this.lat
                ]
            },
            properties: {
                id: this.event_id,
                title: this.title,
                description: this.description,
                type: this.eventType
            }
        };

        return js;
    }
};

class EventList {
    constructor() {
        this.array = [];
    }


    deleteEvent(event_id) {
        var ev_index = -1;
        this.array.forEach(myFunction);

        function myFunction(value, index, array) {
            if (value.getId() == event_id)
                ev_index = index;
        }

        if (ev_index >= 0)
            this.array.splice(ev_index, 1);
    }

    clear() {
        this.array.splice(0, this.array.length);
    }

    addEvent(ev) {
        console.log(ev);
        if (ev) {
            this.deleteEvent(ev.getId());
            this.array.push(ev);
        }
    }

    length() {
        console.log("eventsList length: " + String(this.array.length));
        return this.array.length;
    }

    getIdExist(id) {
        this.array.forEach(myFunction);

        function myFunction(value, index, array) {
            if (value.getId() == id)
                return index;
        }

        return -1;
    }

    getGeoJson() {

        var res_a = [];

        this.array.forEach(myFunction);

        function myFunction(value, index, array) {
            res_a.push(value.asGeoJsonObject());
        }
        var res = {
            type: "FeatureCollection",
            features: res_a
        };

        return res;
    }
}

/**
 * Map area 
 */
var geojson = {
    "type": "FeatureCollection",
    "features": []
};

L.mapbox.accessToken = 'pk.eyJ1IjoibXVzYWRvcyIsImEiOiJja2tvajlvem8wMzk3MzBwNjQ5OGw5MTZmIn0.sWQEQ7chZFxHphyMhgWTEQ';
var map = L.mapbox.map('map') //, 'mapbox://styles/mapbox/streets-v11')
    .setView([32.47, 34.8895], 12)
    .addLayer(L.mapbox.styleLayer('mapbox://styles/mapbox/streets-v11'));


var listings = document.getElementById('listings');

var locations = L.mapbox.featureLayer(geojson).addTo(map);

function setMapMarkers(_geojson) {
    //Check and remove all old children of the list

    if (locations)
        locations.remove();
    if (eventsList.length() <= 0)
        listings.innerHTML = '';

    var arr = [];
    for (i = 0; i < listings.children.length; i++) {
        if (eventsList.getIdExist(listings.children[i].id) <= -1) {
            var ch = listings.children[i];
            console.log(ch.id);
            arr.push(ch);
        }
    }

    arr.forEach(removeNotExist);

    function removeNotExist(value, index, array) {
        listings.removeChild(value);
    }


    locations = L.mapbox.featureLayer(_geojson).addTo(map)

    locations.setGeoJSON(_geojson);

    function setActive(el) {
        var siblings = listings.getElementsByTagName('div');
        for (var i = 0; i < siblings.length; i++) {
            siblings[i].className = siblings[i].className
                .replace(/active/, '').replace(/\s\s*$/, '');
        }

        el.className += ' active';
    }

    locations.eachLayer(function(locale) {

        // Shorten locale.feature.properties to just `prop` so we're not
        // writing this long form over and over again.
        var prop = locale.feature.properties;
        var coord = locale.getLatLng().lat + " , " + locale.getLatLng().lng;

        var parsed = parseInt(prop.type);
        if (isNaN(parsed)) {
            parsed = 0;
        }
        // Each marker on the map.
        var popup = '<h3 class="' + getNameByEventType(parsed) + '">' + prop.title + '</h3><div>' + prop.description;

        var listing = document.getElementById(prop.id) ? document.getElementById(prop.id) : listings.appendChild(document.createElement('div'));
        if (document.getElementById(prop.id))
            listing.innerHTML = "";
        listing.className = getNameByEventType(parsed).toLowerCase() + '_item item';
        listing.id = prop.id;

        var title = listing.appendChild(document.createElement('div'));
        title.innerHTML = '<div><h4>' + prop.title + "</h4></div>";

        var link = listing.appendChild(document.createElement('a'));
        link.href = '#';
        link.className = 'title';

        link.innerHTML = prop.description;
        if (prop.id && prop.type) {
            var alertName = getNameByEventType(prop.type);
            var link_pop_text = `<br /><small class="quiet">Id: ${prop.id} - Alert type: ${alertName}</small>`;
            link.innerHTML += link_pop_text;
            popup += link_pop_text;
            var trimmedCoords = String(locale.getLatLng().lat.toFixed(6)) + " , " + String(locale.getLatLng().lng.toFixed(6));
            popup += `<br/> ${trimmedCoords}`;
        }



        var point = listing.appendChild(document.createElement('div'));
        point.innerHTML = coord;

        //Event's actions buttons container
        var btDiv = listing.appendChild(document.createElement('div'));

        //Update event button
        var update = btDiv.appendChild(document.createElement('button'));
        var sym = update.appendChild(document.createElement('i'));
        sym.className = 'fas fa-pen';
        update.className = "btn btn-primary btn-sm btn-danger";

        update.onclick = function() {
            var splitedCoord = coord.split(",");
            var event = new EventClass("" + prop.id + "", prop.title, prop.description, /*type*/ parsed, /*lon*/ splitedCoord[1], /*lat*/ splitedCoord[0])

            showUpdateModal(event.getId(), event);
        };

        //Delete event button
        var deleteEventBT = btDiv.appendChild(document.createElement('button'));
        var sym = deleteEventBT.appendChild(document.createElement('i'));
        sym.className = 'fas fa-trash-alt';
        deleteEventBT.className = "btn btn-primary btn-sm btn-danger";

        deleteEventBT.onclick = function() {
            var event_id = prop.id;
            if (confirm('Are you sure you want to save this thing into the database?')) {
                // delete it!
                deleteEvent(event_id);
            } else {
                // Do nothing!
                console.log('Thing was not deleted from the database.');
            }
        };

        link.onclick = function() {
            setActive(listing);

            // When a menu item is clicked, animate the map to center
            // its associated locale and open its popup.
            map.setView(locale.getLatLng(), 16);
            locale.openPopup();
            return false;
        };

        // Marker interaction
        locale.on('click', function(e) {
            // 1. center the map on the selected marker.
            map.panTo(locale.getLatLng());

            // 2. Set active the markers associated listing.
            setActive(listing);
        });

        popup += '</div>';
        locale.bindPopup(popup);
        var img_url = prop.type == fireCode ? 'fire' : (prop.type == floodCode ? 'flood' : 'plague');
        img_url += '-marker.png';

        locale.setIcon(L.icon({
            iconUrl: Flask.url_for("static", {
                "filename": "images/" + img_url
            }),
            iconSize: [56, 56],
            iconAnchor: [28, 28],
            popupAnchor: [0, -34]
        }));

    });
}


/**
 * Add event button area
 */
function addEventClick(el) {
    addMapClickListener();
    el.disabled = true; //style.backgroundColor = "red";
    alert("Select point on the map to create an event!");
}

function addMapClickListener() {
    map.once('click', function(e) {
        var coordinates = e.latlng.lng + "," + e.latlng.lat;
        lonlat_input.value = coordinates;

        //Set the form to create new Event
        showCreateModal(e.latlng.lat, e.latlng.lng);
    });
}

/**
 * Form area
 */

window.addEventListener("load", function() {
    //Initialize the 
    drawEventSelectColor();
}, false);

function drawEventSelectColor() {
    let select = document.getElementById("event_select");
    let header = document.getElementById("modal_header");
    let _color = color;

    select.style.borderWidth = "3px";
    if (select.value == 1)
        _color = "red";
    else if (select.value == 2)
        _color = "blue"
    else if (select.value == 3)
        _color = "green"

    select.style.borderColor = header.style.backgroundColor = _color;
}


function showCreateModal(lat, lon) {
    form.reset();
    drawEventSelectColor();
    formTitle.innerHTML = "Add event";
    lonlat_input.value = lat + ", " + lon;
    saveButton.onclick = function() {
        sendEventForm("new");
    };

    //Finally pshow up the modal
    showModal();
}

function showUpdateModal(_id, event) {
    form.reset();
    drawEventSelectColor();
    formTitle.innerHTML = "Edit event";
    saveButton.onclick = function() {
        sendEventForm("update", event.getId());
    };
    title_input.value = event.title;
    des_input.value = event.description;
    select_input.selectedIndex = 1;
    lonlat_input.value = event.lat + "," + event.lon;

    //Finally pshow up the modal
    showModal();
}

function showModal() {
    $("#myModal").modal('show')
    $("#myModal").on('hide.bs.modal', function(event) {
        addButton.disabled = false; //set the add button state to enabled when the modal dismissed
        document.getElementById("new_event_form").reset();
    })
}

/**
 * 
 * @param {New or update} op 
 * @param {Event id to pass it manually - no via the form data} event_id 
 */
function sendEventForm(op, event_id = -1) {
    if (checkFields() == true) {
        var newEvent = new EventClass(event_id, title_input.value, des_input.value, select_input.value, getLongtitude(lonlat_input.value), getLatitude(lonlat_input.value));
        //Send the new event from the form
        if (op == "new") {
            sendNewForm(newEvent);
        } else if (op == "update") {
            //Send update for event
            sendUpdateForm(newEvent);
        } else {
            alert("Form operation error!");
        }
    } else {
        document.getElementById("add_event_submit").click();
    }
}

/**
 * Checking the form requirements
 */
function checkFields() {
    var flag = true;
    if (select_input.value != "1" && select_input.value != "2" && select_input.value != "3") {
        flag = false;
    }

    if (title_input.value.length < 3 || des_input.value.length < 3 || (lonlat_input.value.length < 7 || lonlat_input.value.indexOf(',') < 0))
        flag = false;


    return flag;
}

/**
 * Send new event form data
 * @param {Event to create} event 
 */
function sendNewForm(event) {
    var _form = document.getElementById("new_event_form");
    createEvent(event, "#myModal");
    return false;
}

/**
 * Send an exists event data for updating
 * @param {Event to update} event 
 */
function sendUpdateForm(event) {
    var _form = document.getElementById("new_event_form");
    updateEvent(event, "#myModal");
    return false;
}


/**
 * REST API area - fetch api
 */

/**
 * The local events collection - eventsList
 */
var eventsList = new EventList();

function hideModal(modal) {
    if (modal != null) {
        $(modal).modal('hide');
    }
}

/**
 * Create new event fetch api request
 * @param {event to create} event 
 * @param {the form container} modal 
 */
function createEvent(event, modal) {
    const formData = new FormData();
    formData.append('title', event.title);
    formData.append('description', event.description);
    formData.append('type', event.eventType);
    formData.append('lon', event.lon);
    formData.append('lat', event.lat);


    return fetch(singleUri + '1', {
            method: 'POST',
            body: formData
        }).then(response => response.json())
        .then(result => {
            console.log(result);
            var obj = JSON.stringify(result);
            var _js = JSON.parse(obj);
            if (_js["id"]) {
                getAllEvents();
                alert(`Event number ${_js["id"]} created!`);
            } else
                alert(_js["message"]);

            //Hide the form dialog
            hideModal(modal);
        })
        .catch(error => {
            //console.error('Error:', error);
        });
}

/**
 * Create update event fetch api request
 * @param {event to update} event 
 * @param {the form container} modal 
 */
function updateEvent(event, modal) {
    const formData = new FormData();
    formData.append('title', event.title);
    formData.append('description', event.description);
    formData.append('type', event.eventType);
    formData.append('lon', event.lon);
    formData.append('lat', event.lat);

    return fetch('/event/' + event.getId(), {
            method: 'PUT',
            body: formData
        }).then(response => response.json())
        .then(result => {
            var obj = JSON.stringify(result);
            var _js = JSON.parse(obj);
            if (_js["id"] && _js["id"] == event.getId()) {
                getAllEvents();
                alert('Updating success!');
            } else {
                alert(_js["message"]);
            }

            //Hide the form dialog
            hideModal(modal);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

/**
 * Delete event fetch api request
 * @param {event id to delete} event_id
 */
function deleteEvent(event_id) {

    return fetch('/event/' + event_id, {
            method: 'DELETE'
        }).then(response => response.json())
        .then(result => {
            console.log(result);
            //var obj = JSON.stringify(result);
            //var _js = JSON.parse(obj);
            if ( /*_js["id"] && _js["id"]*/ result == event_id) {
                eventsList.deleteEvent(event_id);
                getAllEvents();
            } else {
                var obj = JSON.stringify(result);
                alert(obj["message"]);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            getAllEvents();
        });
}


/**
 * Get single event fetch api request
 * @param {event to find} event 
 */
function getEvent(event) {
    const formData = new FormData();
    formData.append('title', event.title);
    formData.append('description', event.description);
    formData.append('type', event.eventType);

    return fetch('/event/' + event.getId(), {
            method: 'GET',
            body: formData
        }).then(response => response.json())
        .then(result => {
            console.log(result);
            var obj = JSON.stringify(result);
            var _js = JSON.parse(obj);

            //Check if the id field exist
            if (_js["id"] && _js["id"] == event.getId()) {
                alert('Updating success!');
                getAllEvents();
            } else {
                alert(_js["message"]);
            }
            if (modal != null) {
                $(modal).modal('hide');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


/**
 * Get all the events fetch api request
 */
function getAllEvents() {

    return fetch('/events/', {
            method: 'GET'
        }).then(response => response.json())
        .then(result => {
            if (result) {
                console.log(result);
                var obj = typeof result !== 'undefined' ? JSON.stringify(result) : "";
                var obj2 = typeof obj !== 'undefined' ? JSON.parse(obj) : "";
                console.log(obj2[0]);



                //}
                //_js.forEach(addEventTolist);

                function addEventTolist(value, index, array) {
                    console.log("value: ");
                    console.log(value['id']);
                    console.log(value['title']);
                    var e = new EventClass();
                    e.fromJson(value);
                    console.log(e.getId());
                    eventsList.addEvent(e);
                    console.log(eventsList.getGeoJson());
                    var _geoJson = eventsList.getGeoJson();
                    setMapMarkers(_geoJson);
                    //console.log("list: ");
                    console.log(eventsList);
                }

                if (typeof obj2 !== 'undefined' && obj2.length > 0)
                    obj2.forEach(addEventTolist);
                else {
                    eventsList.clear();
                    setMapMarkers(geojson);
                    console.log("events cleared");
                }
            } else {
                setMapMarkers(geojson);
            }

        })
        .catch(error => {
            console.error('Error:', error);
            setMapMarkers(geoJson);
        });
}

//Set the first get all operation and its interval
getAllEvents();
setInterval(getAllEvents, 8000);