/*
 * LibrePlan App
 *
 * Copyright (C) 2012  Manuel Rego Casasnovas <rego@igalia.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Boun user web services path
var PATH = 'ws/rest/bounduser/';

// Global vars
var url;
var username;
var baseAuth;
var tasks;

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    reloadStoredConfiguration();
    setConfigurationInputs();
    refreshTasksList();
}

function isOnline() {
    var networkState = navigator.network.connection.type;
    return (networkState != Connection.NONE);
}

function makeBaseAuth(user, password) {
    var token = user + ':' + password;
    var hash = btoa(token);
    return 'Basic ' + hash;
}

function offLineCallback() {
	refreshTasksList();
}

function refreshTasksList() {
    if (!isOnline()) {
        navigator.notification.alert(
                'Sorry but to be on-line in order to use LibrePlan App',
                offLineCallback,
                'Off-line',
                'Ok'
            );
    }

    serviceUrl = url + PATH + 'mytasks';

    $.ajax({
        type: 'GET',
        url: serviceUrl,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', baseAuth);
        }
    }).done(function(data) {
        var tasksList = data.firstChild;
        tasks = new Array();

        for (i = 0; i < tasksList.childNodes.length; i++) {
            var taskData = tasksList.childNodes[i];
            var task = {
                    name: taskData.getAttribute('name'),
                    code: taskData.getAttribute('code'),
                    projectName: taskData.getAttribute('project-name'),
                    startDate: taskData.getAttribute('start-date'),
                    endDate: taskData.getAttribute('end-date'),
                    effort: taskData.getAttribute('effort'),
                    progressValue: taskData.getAttribute('progress-value'),
                    progressDate: taskData.getAttribute('progress-date'),
            };
            tasks[i] = task;
        }

        fillTaskLists();
    }).fail(function() {
        navigator.notification.alert(
            'Problems connecting to LibrePlan server',
            goToConfiguration,
            'Error',
            'Ok'
        );
    });
}

function fillTaskLists() {
    var list = $('#tasks-list');
    list.html('');

    for ( var i = 0; i < tasks.length; i++) {
        list.append(createLiTask(i));
    }
    list.listview('destroy').listview();
}

function createLiTask(index) {
    var task = tasks[index];

    var li = $('<li />');
    $('<h3 />').append(task.name).appendTo(li);
    $('<p />').append($('<strong />').append('Effort: ' + task.effort)).appendTo(li);
    $('<p />').append('Dates: ' + task.startDate + ' - ' + task.endDate).appendTo(li);
    $('<p />').append('Project: ' + task.projectName).appendTo(li);
    $('<p class="ui-li-aside" />').append(toPercentage(task.progressValue)).appendTo(li);

    return li;
}

function toPercentage(progress) {
    if (!progress) {
        progress = 0;
    }
    return parseInt(progress) + ' %';
}

function saveConfiguration() {
    var url = $('#url').val();
    window.localStorage.setItem('url', url);

    var username = $('#username').val();
    window.localStorage.setItem('username', username);

    var password = $('#password').val();
    var baseAuth = makeBaseAuth(username, password);
    window.localStorage.setItem('baseAuth', baseAuth);

    reloadStoredConfiguration();
    refreshTasksList();
}

function reloadStoredConfiguration() {
    url = window.localStorage.getItem('url');
    username = window.localStorage.getItem('username');
    baseAuth = window.localStorage.getItem('baseAuth');
}

function setConfigurationInputs() {
    $('#url').val(url);
    $('#username').val(username);
}

function goToConfiguration() {
    $.mobile.changePage('#configuration');
}
