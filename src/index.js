const d3 = require('d3');
const dscc = require('@google/dscc');
const local = require('./localMessage.js');

function sortDate(a, b){
  return a.date - b.date;
}
function split_at_index_first(value, index)
{
 return value.substring(0, index);
}
function split_at_index_last(value, index)
{
 return value.substring(index);
}

function getData(tblList, dateTable, fullDateTable, data, day){

  dateTable = [];
  fullDateTable = [];
  data = updateData(tblList,  dateTable, fullDateTable);
  var firstPos = 0;
  var lastPos= 0;
 
  for(var i = 0; i < dateTable.length;i++){
    if(dateTable[i] == day){
      firstPos = i;
      break;
    }
  }
  for(i = 0; i < dateTable.length;i++){
    if(dateTable[i] == day){
      lastPos = i;
     
    }
  }
 
  if(firstPos == 0 && lastPos == 0){
    for(i = 0; i < fullDateTable.length; i++){
      data.pop();
    }
  }else{
  
    for(i = 0; i < firstPos; i++){
      
      data.shift();
      dateTable.shift();
    }

    for(i = 0; i < fullDateTable.length-1 - lastPos; i++){ 
      data.pop();
      dateTable.pop();
    }
  }
  return data;
}

function updateData(tblList, dateTable, fullDateTable){

  var counter = -1;

  // parse the date / time
  var parseDate = d3.timeParse("%Y.%m.%d-%H:%M:%S");
  var properDate;

  var data = tblList.map(row => {
    properDate = (split_at_index_first(row["dimension"][0], 19))
                .removeCharAt(5).removeCharAt(7).removeCharAt(9).removeCharAt(11).removeCharAt(13);
    
    dateTable.push(parseInt(split_at_index_first( properDate, 8)));

    if(split_at_index_last( split_at_index_first(row["dimension"][0], 19),17) == "00"){
      var split1, split2;
      var merged;
      split1 = split_at_index_first(row["dimension"][0], 17)
      split2 = "01"
      merged = split1 + split2
      fullDateTable.push(merged);
    }else{
      fullDateTable.push(split_at_index_first(row["dimension"][0], 19));
    }
    counter++;
    
    return {
        
      date: parseDate(fullDateTable[counter]),
      close: row["metric"][0],   
              
    }  
  }).sort(sortDate);

  dateTable.sort();
  fullDateTable.sort();
  return data;
}

function getOptions(dateTable){

  var options = new Array();
  options.push("None");
  options.push(String(dateTable[0]));

  for (var i = 0; i < dateTable.length; i++) {
    
    var exsists=0;
    for(var j = 0; j < options.length;j++){
       
        if(dateTable[i] == options[j]){
            exsists = 1;
        }
    }
    if(exsists == 0){
      options.push(String(dateTable[i]));
        
    }
}
  return options;

}

// Pass the checkbox name to the function
function getCheckedBoxes(chkboxName) {
  var checkboxes = document.getElementsByName(chkboxName);
  var checkboxesChecked = [];
  // loop over them all
  for (var i=0; i<checkboxes.length; i++) {
     // And stick the checked ones onto an array...
     if (checkboxes[i].checked) {
        checkboxesChecked.push(checkboxes[i]);
     }
  }
  // Return the array if it is non-empty, or null
  return checkboxesChecked.length > 0 ? checkboxesChecked : null;
}

function getOneMonthBefore(date){
  //console.log(date);
  var year = split_at_index_first(date, 4);
  var month = split_at_index_first(split_at_index_last( date, 4),2);
  var day = split_at_index_last(date, 6);
  //var day = 16;
  var days;

  if(day == "31"){
    date -= 30;
  }else
  if(day == "30"){
    days = getDays(month - 1);
    date = String(year) + String(month-1) + String(days);
  }else{
    days = getDays(month - 1);
    date = String(year)+ String(month-1) + String(days-(30-day));
  }

  //console.log(date);
  return date;
}

function getDays(month){
  if(month == "01" || month == "03" ||month == "05" ||month == "07" ||month == "08" ||month == "10" ||
  month == "12" ){
    return 31;
  }
  if(month == "04" || month == "06" ||month == "09" ||month == "11" ){
    return 30;
  }
  if(month == "02"){
    return 28;
  }
}

function getMaxMetric(message){
  var max = 0;
  var maxDate;
  var tblList = message.tables.DEFAULT;
  tblList.forEach(function(row) {
    if(row["metric"][0] > max){
      max = row["metric"][0];
      maxDate = (split_at_index_first(row["dimension"][0], 19))
      .removeCharAt(5).removeCharAt(7).removeCharAt(9).removeCharAt(11).removeCharAt(13);
    }   
  });

  return maxDate;
}
function getMaxMetricValue(message){
  var max = 0;
  //var maxDate;
  var tblList = message.tables.DEFAULT;
  tblList.forEach(function(row) {
    if(row["metric"][0] > max){
      max = row["metric"][0];
      
    }   
  });

  return max;
}
String.prototype.removeCharAt = function (i) {
  var tmp = this.split(''); // convert to an array
  tmp.splice(i - 1 , 1); // remove 1 element from the array (adjusting for non-zero-indexed counts)

  return tmp.join(''); // reconstruct the string
}

// change this to 'true' for local development
// change this to 'false' before deploying
export const LOCAL = false;

// parse the style value
const styleVal = (message, styleId) => {
  if (typeof message.style[styleId].defaultValue === "object") {
    return message.style[styleId].value.color !== undefined
      ? message.style[styleId].value.color
      : message.style[styleId].defaultValue.color;
  }
  return message.style[styleId].value !== undefined
    ? message.style[styleId].value
    : message.style[styleId].defaultValue;
};

const drawViz = message => {
  
  // set the dimensions and margins of the graph
  var margin = {top: 20, right: 20, bottom: 30, left: 50},
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

  if (document.querySelector("svg")) {
    let oldSvg = document.querySelector("svg");
    oldSvg.parentNode.removeChild(oldSvg);
  }
  

  
  
  var currentDate = "20201116";
  var yestersayLineColor = styleVal(message, "selectColor1");
  var weekLineColor = styleVal(message, "selectColor2");
  var monthLineColor = styleVal(message, "selectColor3");
  var selectedLineColor = styleVal(message, "selectColor4");
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  var isToday = 0;
  var maxMetric = getMaxMetricValue(message);

  today = yyyy+mm+dd;

  // append the svg obgect to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

  var tblList = message.tables.DEFAULT;
  var dateTable = new Array();
  var fullDateTable = new Array();
  var data = updateData(tblList, dateTable, fullDateTable);
  var allDays = getOptions(dateTable);
  var options = [];
  options.push("Yesterday");
  options.push("One week before");
  options.push("One month before");

    // set the ranges
    var x = d3.scaleTime().range([0, width]);
    var  y = d3.scaleLinear().range([height, 0]);
  
    // define the line
    var valueline = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) {return y(d.close); });

  var name = ["submit", "clear"];
  d3.selectAll("button")
              .data(name)
              .enter()
              .append("button")
              .text("Draw")
              .attr("type", "button")
              .attr("id", function(d) { return d; });

  for(var i = 0; i < dateTable.length;i++){
    if(dateTable[i] == today){
      isToday = 1;
    }
  }
  
  if(isToday){

    d3.select("body").selectAll("input")
                .data(options)
                .enter()
                .append('label')
                .attr('for',function(d,i){ return 'a'+i; })
                .text(function(d) { return d; })
                .append("input")
                .attr("type", "checkbox")
                .attr("name", "checkboxes")
                .attr("id", function(d) { return 'a'+d; });
  }else{
    if(!document.getElementById("select") && !document.getElementById("select0") ){

      for(i = 0; i < 3; i++){

        var select = d3.select('body')
                      .append('select')
                      .attr("id", function(d) { return 'select'+i; })
                      .attr('class','select');

        select
            .selectAll('option')
            .data(allDays).enter()
            .append('option')
            .attr("id", function(d) { return 'a'+d; })
            .text(function (d) { return d; });
      }
    }
  }
   
  if(!document.getElementById("select0")){
    var select = d3.select('body')
                  .append('select')
                  .attr('id', 'select')
                  .attr('class','select');

    select
        .selectAll('option')
        .data(allDays).enter()
        .append('option')
        .attr("id", function(d) { return 'a'+d; })
        .text(function (d) { return d; });
  }

  document.getElementById("submit").onclick = drawLine;
  document.getElementById("clear").firstChild.data = "Clear";
  document.getElementById("clear").onclick = clearLine;

  var j = 0;
  for(var i = 0; i < 24 ; i++){
    svg.append("rect")
      .attr("width", width / 24)
      .attr("height", height)
      .attr("x", 0 + i*width / 24)
      .attr("y", 0)
      .attr("color", "black")
      .attr("opacity", 0)
      .attr("id", function() { return "r" + j++; })
      .attr("name", "hiddenRect")
      .on("mouseover", showTooltip)
      .on("mouseout", removeTooltip)
  }
  
  function drawLine(){
    clearLine();
    checkedBoxes = getCheckedBoxes("checkboxes");
    if(document.getElementById("select")){
      var e = document.getElementById("select");
      var selectOption = e.options[e.selectedIndex].text;
    }else{
      var e0 = document.getElementById("select0");
      var selectOption0 = e0.options[e0.selectedIndex].text;
      var e1 = document.getElementById("select1");
      var selectOption1 = e1.options[e1.selectedIndex].text;
      var e2 = document.getElementById("select2");
      var selectOption2 = e2.options[e2.selectedIndex].text;
    }
  
    var whichLine;

    if(checkedBoxes){
      for(i = 0; i < checkedBoxes.length; i++){
        var date;
        var color;

        if(checkedBoxes[i].id === "aYesterday"){
          date = currentDate - 1;
          color = yestersayLineColor;
          whichLine = "a";
        }else if(checkedBoxes[i].id === "aOne week before"){
          date = currentDate - 7;
          color = weekLineColor;
          whichLine = "b";
        }else if(checkedBoxes[i].id === "aOne month before"){
          date = getOneMonthBefore(currentDate);
          color = monthLineColor;
          whichLine = "c";
        }else{
          date = split_at_index_last(checkedBoxes[i].id, 1);

        }

        data = getData(tblList, dateTable, fullDateTable, data, date);
        // Scale the range of the data
        x.domain(d3.extent(data, function(d) { return d.date; }));
        y.domain([0, d3.max(data, function(d) { return d.close; })]);
        
        // Add the valueline path.
        svg.append("path")
            .data([data])
            .attr("d", valueline)
            .attr("stroke", color)
            .attr("fill", "none")
            .attr("id", "line");
        var j = 0;

        if(styleVal(message, "showDots")){

          svg.selectAll("dot")
              .data(data)
              .enter().append("circle")
              .attr("r", 3.5)
              .attr("cx", function(d) { return x(d.date) ; })
              .attr("cy", function(d) { return y(d.close) ; })
              .attr("id", function() { return whichLine + j++; })
              .attr("name", "dot")
              .style("fill",'#FF7F0E')
              .on("mouseover", mouse)
              .on("mouseout", mousemove);
        } 
      }
    }
    
    function mouse(){

      whichLine = split_at_index_first(event.path[0].id, 1);

      if(whichLine == "a"){
        date = currentDate - 1;
        
      }
      if(whichLine == "b"){
        date = currentDate - 7;
      }

      if(whichLine == "c"){
        date = getOneMonthBefore(currentDate);
      }
      data = getData(tblList, dateTable, fullDateTable, data, date);
      var actualDot =  split_at_index_last( event.path[0].id, 1);
      var coordinates= d3.pointer(event);
      var x1 = coordinates[0];
      var y1 = coordinates[1];

      svg.append("text")
      .attr("id", "dotValue")
      .data(data)
      .attr("x",x1+10)
      .attr("y", y1+10)
      .text(data[actualDot].close);
    }
    if(selectOption != "None"){
      date = selectOption;
      data = getData(tblList, dateTable, fullDateTable, data, date);
      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) { return d.close; })]);
      
      // Add the valueline path.
      svg.append("path")
          .data([data])
          .attr("d", valueline)
          .attr("stroke", selectedLineColor)
          .attr("fill", "none")
          .attr("id", "line");

      j = 0;
      svg.selectAll("dot")
          .data(data)
          .enter().append("circle")
          .attr("r", 3.5)
          .attr('for',function(d,j){ return 'a'+j; })
          .attr("cx", function(d) { return x(d.date) ; })
          .attr("cy", function(d) { return y(d.close) ; })
          .attr("id", function() { return 'a'+j++; })
          .attr("name", "dot")
          .style("fill",'#FF7F0E')
          .on("mouseout", mousemove)
          .on("mouseover", (event) => {
            date = selectOption;
            data = getData(tblList, dateTable, fullDateTable, data, date);
            var actualDot =  split_at_index_last( event.path[0].id, 1);
            var coordinates= d3.pointer(event);
            var x1 = coordinates[0];
            var y1 = coordinates[1];

            svg.append("text")
            .attr("id", "dotValue")
            .data(data)
            .attr("x",x1+10)
            .attr("y", y1+10)
            .text(data[actualDot].close);
          }); 
    }
    if(selectOption0 != "None"){

      date = selectOption0;
      data = getData(tblList, dateTable, fullDateTable, data, date);
      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0,  maxMetric]);

      // Add the valueline path.
      svg.append("path")
          .data([data])
          .attr("d", valueline)
          .attr("stroke", yestersayLineColor)
          .attr("fill", "none")
          .attr("id", "line");

      j = 0;
      svg.selectAll("dot")
          .data(data)
          .enter().append("circle")
          .attr("r", 3.5)
          .attr('for',function(d,j){ return 'a'+j; })
          .attr("cx", function(d) { return x(d.date) ; })
          .attr("cy", function(d) { return y(d.close) ; })
          .attr("id", function() { return 'a'+j++; })
          .attr("name", "dot")
          .style("fill",'#FF7F0E')
          .on("mouseout", mousemove)
          .on("mouseover", (event) => {
            date = selectOption0;
            data = getData(tblList, dateTable, fullDateTable, data, date);
            var actualDot =  split_at_index_last( event.path[0].id, 1);
            var coordinates= d3.pointer(event);
            var x1 = coordinates[0];
            var y1 = coordinates[1];

            svg.append("text")
            .attr("id", "dotValue")
            .data(data)
            .attr("x",x1+10)
            .attr("y", y1+10)
            .text(data[actualDot].close);
          });
    }
    if(selectOption1 != "None"){

      date = selectOption1;
      data = getData(tblList, dateTable, fullDateTable, data, date);
      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0,  maxMetric]);
      
      // Add the valueline path.
      svg.append("path")
          .data([data])
          .attr("d", valueline)
          .attr("stroke", weekLineColor)
          .attr("fill", "none")
          .attr("id", "line");

      j = 0;
      svg.selectAll("dot")
          .data(data)
          .enter().append("circle")
          .attr("r", 3.5)
          .attr('for',function(d,j){ return 'a'+j; })
          .attr("cx", function(d) { return x(d.date) ; })
          .attr("cy", function(d) { return y(d.close) ; })
          .attr("id", function() { return 'a'+j++; })
          .attr("name", "dot")
          .style("fill",'#FF7F0E')
          .on("mouseout", mousemove)
          .on("mouseover", (event) => {
            date = selectOption1;
            data = getData(tblList, dateTable, fullDateTable, data, date);
            var actualDot =  split_at_index_last( event.path[0].id, 1);
            var coordinates= d3.pointer(event);
            var x1 = coordinates[0];
            var y1 = coordinates[1];

            svg.append("text")
            .attr("id", "dotValue")
            .data(data)
            .attr("x",x1+10)
            .attr("y", y1+10)
            .text(data[actualDot].close);
          });
    }
    if(selectOption2 != "None"){

      date = selectOption2;
      data = getData(tblList, dateTable, fullDateTable, data, date);
      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0,  maxMetric]);
      
      // Add the valueline path.
      svg.append("path")
          .data([data])
          .attr("d", valueline)
          .attr("stroke", monthLineColor)
          .attr("fill", "none")
          .attr("id", "line");

      j = 0;
      svg.selectAll("dot")
          .data(data)
          .enter().append("circle")
          .attr("r", 3.5)
          .attr('for',function(d,j){ return 'a'+j; })
          .attr("cx", function(d) { return x(d.date) ; })
          .attr("cy", function(d) { return y(d.close) ; })
          .attr("id", function() { return 'a'+j++; })
          .attr("name", "dot")
          .style("fill",'#FF7F0E')
          .on("mouseout", mousemove)
          .on("mouseover", (event) => {
            date = selectOption2;
            data = getData(tblList, dateTable, fullDateTable, data, date);
            var actualDot =  split_at_index_last( event.path[0].id, 1);
            var coordinates= d3.pointer(event);
            var x1 = coordinates[0];
            var y1 = coordinates[1];

            svg.append("text")
            .attr("id", "dotValue")
            .data(data)
            .attr("x",x1+10)
            .attr("y", y1+10)
            .text(data[actualDot].close);
          });
    }
  }
  
  function showTooltip(){

    var hiddenCoords = event.x;
    var actualRect =  split_at_index_last( event.path[0].id, 1);
    var value1 = 0, value2 = 0, value3 = 0, value4 = 0, value5 = 0, value6 = 0, value7 = 0;
    var date1, date2, date3, date4 = 0, date5 = 0, date6 = 0, date7 = 0;
    checkedBoxes = getCheckedBoxes("checkboxes");
    if(document.getElementById("select")){
      var e = document.getElementById("select");
      var selectOption = e.options[e.selectedIndex].text;
    }else{
      var e0 = document.getElementById("select0");
      var selectOption0 = e0.options[e0.selectedIndex].text;
      var e1 = document.getElementById("select1");
      var selectOption1 = e1.options[e1.selectedIndex].text;
      var e2 = document.getElementById("select2");
      var selectOption2 = e2.options[e2.selectedIndex].text;
    }

    if(checkedBoxes){
    
      for(var i = 0; i < checkedBoxes.length; i++){

        var date;

        if(checkedBoxes[i].id == "aYesterday"){
          date = currentDate - 1;
          data = getData(tblList, dateTable, fullDateTable, data, date);
          if(actualRect < data.length){
            value1 = data[actualRect].close;
            date1 = split_at_index_first(split_at_index_last( String(data[actualRect].date), 4),14);
          }else{
            value1 = 0;
          }
         
        }else if(checkedBoxes[i].id == "aOne week before"){
          date = currentDate - 7;
          data = getData(tblList, dateTable, fullDateTable, data, date);
          if(actualRect < data.length){
            value2 = data[actualRect].close;
            date2 = split_at_index_first(split_at_index_last( String(data[actualRect].date), 4),14);
          }else{
            value2 = 0;
          }

        }else if(checkedBoxes[i].id == "aOne month before"){
          date = getOneMonthBefore(currentDate);
          data = getData(tblList, dateTable, fullDateTable, data, date);
          if(actualRect < data.length){
            value3 = data[actualRect].close;
            date3 = split_at_index_first(split_at_index_last( String(data[actualRect].date), 4),14);
          }else{
            value3 = 0;
          }
          
        }else{
          date = split_at_index_last(checkedBoxes[i].id, 1);
        }
      }
    }

    if(selectOption != "None"){
      date = selectOption;
      data = getData(tblList, dateTable, fullDateTable, data, date);
      if(actualRect < data.length){
        value4 = data[actualRect].close;
        date4 = split_at_index_first(split_at_index_last( String(data[actualRect].date), 4),14);
      }else{
        value4 = 0;
      }
    }

    if(selectOption0 != "None"){

      date = selectOption0;
      data = getData(tblList, dateTable, fullDateTable, data, date);
      if(actualRect < data.length){
        value5 = data[actualRect].close;
        date5 = split_at_index_first(split_at_index_last( String(data[actualRect].date), 4),14);
      }else{
        value5 = 0;
      }
    }

    if(selectOption1 != "None"){
      date = selectOption1;
      data = getData(tblList, dateTable, fullDateTable, data, date);
      if(actualRect < data.length){
        value6 = data[actualRect].close;
        date6 = split_at_index_first(split_at_index_last( String(data[actualRect].date), 4),14);
      }else{
        value6 = 0;
      }
    }

    if(selectOption2 != "None"){
      date = selectOption2;
      data = getData(tblList, dateTable, fullDateTable, data, date);
      if(actualRect < data.length){
        value7 = data[actualRect].close;
        date7 = split_at_index_first(split_at_index_last( String(data[actualRect].date), 4),14);
      }else{
        value7 = 0;
      }
    }

    data = getData(tblList, dateTable, fullDateTable, data, split_at_index_first( getMaxMetric(message),8));

    if(value1 !=0 || value2 !=0  || value3 !=0 || value4 != 0|| value5 != 0|| value6 != 0|| value7 != 0){
      var tooltip = svg.selectAll("g")
              .data(data)
              .enter().append("g")
              .attr("id", "toolTip")
              .attr("transform", function(d, i) { return "translate(0," +  height/10 + ")"; });

      tooltip.append("rect")
        .attr("fill", "blue")
        .attr("id", "toolTipRect")
        .attr("width",   160)
        .attr("height", 80)
        .attr("x", hiddenCoords-200 < 0 ? 0 : hiddenCoords-200)
        .attr("stroke", "pink")
        .attr("stroke-width", 5)
        .attr("fill-opacity", 0.1)
        .attr("stroke-opacity", 0.9)

      if(value1 != 0){
        tooltip.append("text")
        .attr("x", hiddenCoords-200 < 0 ? 0 : hiddenCoords-200)
        .attr("y", height / 20-10)
        .attr("dy", ".35em")
        .text(date1 + ": " + value1);
      }
      
      if(value2 != 0){
        tooltip.append("text")
        .attr("x", hiddenCoords-200 < 0 ? 0 : hiddenCoords-200)
        .attr("y", height / 20 + 10)
        .attr("dy", ".35em")
        .text(date2 + ": " + value2);
      }
    
      if(value3 != 0){
        tooltip.append("text")
        .attr("x", hiddenCoords-200 < 0 ? 0 : hiddenCoords-200)
        .attr("y", height / 20 + 30)
        .attr("dy", ".35em")
        .text(date3 + ": " + value3);
      }
      if(value4 != 0){
        tooltip.append("text")
        .attr("x", hiddenCoords-200 < 0 ? 0 : hiddenCoords-200)
        .attr("y", height / 20 + 50)
        .attr("dy", ".35em")
        .text(date4 + ": " + value4);
      }
      if(value5 != 0){
        tooltip.append("text")
        .attr("x", hiddenCoords-200 < 0 ? 0 : hiddenCoords-200)
        .attr("y", height / 20-10)
        .attr("dy", ".35em")
        .text(date5 + ": " + value5);
      }
      if(value6 != 0){
        tooltip.append("text")
        .attr("x", hiddenCoords-200 < 0 ? 0 : hiddenCoords-200)
        .attr("y", height / 20 + 10)
        .attr("dy", ".35em")
        .text(date6 + ": " + value6);
      }
      if(value7 != 0){
        tooltip.append("text")
        .attr("x", hiddenCoords-200 < 0 ? 0 : hiddenCoords-200)
        .attr("y", height / 20 + 30)
        .attr("dy", ".35em")
        .text(date7 + ": " + value7);
      }
    }
} 

function removeTooltip(){
  var element = document.getElementById("toolTip");

  while (element) {
    element = document.getElementById("toolTip");
    if(element){
      element.parentNode.removeChild(element);
    }
  }
}

  function clearLine(){
    var element = document.getElementById("line");
    while (element) {
      element = document.getElementById("line");
      if(element){
        element.parentNode.removeChild(element);
      }
    }

    element = document.getElementsByName("dot");

    if(element.length != 0){
      var len = element.length;
      var parentNode = element[0].parentNode;
      for(var i=0; i<len; i++)
      {
        parentNode.removeChild(element[0]);
      }
    }
  }

  function mousemove() {

    var element = document.getElementById("dotValue");
    while (element) {
      element = document.getElementById("dotValue");
      if(element){
        element.parentNode.removeChild(element);
      }
    }
  }

  var checkedBoxes = getCheckedBoxes("checkboxes");
  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([0, d3.max(data, function(d) { return d.close; })]);

  // Add the X Axis
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add the Y Axis
  svg.append("g")
    .call(d3.axisLeft(y));
  
};

// renders locally
if (LOCAL) {
  drawViz(local.message);
} else {
  dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});
}