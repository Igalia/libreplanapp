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

// Convert in params
var url = 'http://unstable.libreplan.org/libreplan-unstable/';
var username = 'r1';
var password = 'r1';

var tasks;

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
	getTasksList();
}

function makeBaseAuth(user, password) {
    var token = user + ':' + password;
    var hash = btoa(token);
    return "Basic " + hash;
  }

function getTasksList() {
    myurl = url + PATH + 'mytasks';

    $.ajax({
        type: "GET",
        url: myurl,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', makeBaseAuth(username, password));
        }
    }).done(function (data) {
        dump(data.childNodes);
        dump(data.getElementsByTagName('task'));

        tasksList = data.firstChild;
        tasks = new Array();

        for (i = 0; i < tasksList.childNodes.length; i++) {
            taskData = tasksList.childNodes[i];
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
    });
}

function dump(obj) {
    var out = '';
    for (var i in obj) {
        out += i + ": " + obj[i] + "\n";
    }

    console.log(out);
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
    return parseInt(progress) + " %";
}
