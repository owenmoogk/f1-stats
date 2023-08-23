import { useState, useEffect } from 'react';
import $ from 'jquery';

export default function Drivers(){
  const [driverList, setDriverList] = useState([]);
  const [pointsRemaining, setPointsRemaining] = useState(-1);
  const [sumPoints, setSumPoints] = useState(-1);
  const [pointsRemainingForSecond, setPointsRemainingForSecond] = useState(-1)
  const [mostRecentRound, setMostRecentRound] = useState(-1);

  const [winningAbilityCalculated, setWinningAbilityCalculated] = useState(false)

  function xmlToJson(xml) {
	
    // Create the return object
    var obj = {};
  
    if (xml.nodeType == 1) { // element
      // do attributes
      if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType == 3) { // text
      obj = xml.nodeValue;
    }
  
    // do children
    if (xml.hasChildNodes()) {
      for(var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;
        if (typeof(obj[nodeName]) == "undefined") {
          obj[nodeName] = xmlToJson(item);
        } else {
          if (typeof(obj[nodeName].push) == "undefined") {
            var old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xmlToJson(item));
        }
      }
    }
    return obj;
  };
  
  class DriverPoints{
    name = ""
    points = -1
    pointsToWin = 0
    canWin = false
    canWinByThemselves = false
    highestPossible = -1
    lowestPossible = -1

    constructor(name, points){
      this.name = name
      this.points = parseInt(points)
    }
  }
  
  function saveDrivers(json){
    var x = [];
    for (var i = 0; i < json.length; i++){
      var driver = json[i]
      x.push(new DriverPoints(driver.Driver.GivenName["#text"] + " " + driver.Driver.FamilyName["#text"], parseInt(driver["@attributes"].points)))
    }
    setDriverList(x);
  }
  
  function getData(){
    fetch ("http://ergast.com/api/f1/current/driverStandings")
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      var json = xmlToJson(data)
      json = json.MRData.StandingsTable.StandingsList.DriverStanding
      saveDrivers(json)
    })
  }

  function getMostRecentRound(){
    fetch("http://ergast.com/api/f1/current/last/results")
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      setMostRecentRound(parseInt($(data).find("Race").attr("round")))
    })
  }

  function getPointsRemaining(){
    fetch("http://ergast.com/api/f1/current")
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {

      const pointsPerRace = 102;
      const pointsPerSprint = 36;

      var totalPointsRemaining = 0;
      var totalPointsRemainingForSecond = 0;
      var sumPointsCalculated = 0
      $(data).find("Race").each((index, element) => {
        if (parseInt($(element).attr("round")) > mostRecentRound){
          totalPointsRemaining += 26;
          totalPointsRemainingForSecond += 18
          sumPointsCalculated += pointsPerRace
          if ($(element).find("Sprint").length > 0){
            totalPointsRemaining += 8;
            totalPointsRemainingForSecond += 7
            sumPointsCalculated += pointsPerSprint;
          }
        }
      })
      setSumPoints(sumPointsCalculated)
      setPointsRemaining(totalPointsRemaining);
      setPointsRemainingForSecond(totalPointsRemainingForSecond);
    })
  }

  function calculateWinningAbility(){
    var firstPlaceDriver = driverList[0]
    var secondPlaceDriver = driverList[1]
    var maxSecondPlacePoints = secondPlaceDriver.points + pointsRemaining;
    firstPlaceDriver.pointsToWin = maxSecondPlacePoints + 1 - firstPlaceDriver.points;

    var firstPlacePoints = firstPlaceDriver.points;
    for (var driver of driverList){
      if (driver.points + pointsRemaining < firstPlacePoints){
        driver.canWin = false
      }
      else{
        driver.canWin = true;
      }
    }

    for (var driver of driverList){
      if (driver.points + pointsRemaining > firstPlacePoints + pointsRemainingForSecond){
        driver.canWinByThemselves = true
      }
      else{
        driver.canWinByThemselves = false;
      }
    }

    // getting a drivers highest possible position
    for (var driver of driverList){
      
      var tmpDriverPoints = JSON.parse(JSON.stringify(driverList))
      var pointsPool = sumPoints;
      
      tmpDriverPoints.find(x => x.name == driver.name).points += pointsRemaining;
      pointsPool -= pointsRemaining;

      var currDriverPoints = tmpDriverPoints.find(x => x.name == driver.name).points;
      while(pointsPool > 0){
        if (tmpDriverPoints.find(x => x.points + 1 < currDriverPoints || x.points > currDriverPoints))
        {
          tmpDriverPoints.find(x => x.points + 1 < currDriverPoints || x.points > currDriverPoints).points += 1;
        }
        else{
          tmpDriverPoints.find(x => x.points == currDriverPoints || x.points == currDriverPoints - 1).points += 1;
        }
        pointsPool -= 1
      }

      tmpDriverPoints = tmpDriverPoints.sort((a,b) => b.points- a.points)
      var currentIndex = 0;
      for (var tmpDriver of tmpDriverPoints){
        currentIndex++;
        if (tmpDriver.name == driver.name){
          driver.highestPossible = currentIndex;
          break;
        }
      }      
    }

    // getting a drivers lowest possible position
    for (var driver of driverList){
      
      var tmpDriverPoints = JSON.parse(JSON.stringify(driverList))
      var pointsPool = sumPoints;

      var currDriverPoints = tmpDriverPoints.find(x => x.name == driver.name).points;
      while(pointsPool > 0){
        if (tmpDriverPoints.find(x => x.points <= currDriverPoints && x.name != driver.name))
        {
          tmpDriverPoints.find(x => x.points <= currDriverPoints && x.name != driver.name).points += 1;
        }
        pointsPool -= 1
      }

      tmpDriverPoints = tmpDriverPoints.sort((a,b) => b.points - a.points)
      var currentIndex = 0;
      for (var tmpDriver of tmpDriverPoints){
        currentIndex++;
        if (tmpDriver.name == driver.name){
          driver.lowestPossible = currentIndex;
          break;
        }
      }      
    }

    setWinningAbilityCalculated(true)

  }

  useEffect(() => {
    getData()
    getMostRecentRound()
  }, [])

  useEffect(() => {
    if (mostRecentRound > 0){
      getPointsRemaining()
    }
  }, [mostRecentRound])

  useEffect(() => {
    if (driverList.length >= 20){
      calculateWinningAbility()
    }
  }, [pointsRemaining, pointsRemainingForSecond])


  return (
    <table>
      <tbody>
        <tr>
          <th>Position</th>
          <th>Name</th>
          <th>Points</th>
          <th>Points to win</th>
          <th>Can Win</th>
          <th>Winnable on Performance</th>
          <th>Highest Possible Position</th>
          <th>Lowest Possible Position</th>
        </tr>
        {winningAbilityCalculated
          ? driverList.map((driver, index) => 
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{driver.name}</td>
              <td>{driver.points}</td>
              <td>{driver.pointsToWin == 0 ? '-' : driver.pointsToWin}</td>
              <td className={driver.canWin ? "green" : "red"}>{driver.canWin ? "Yes" : "No"}</td>
              <td className={driver.canWinByThemselves ? "green" : "red"}>{driver.canWinByThemselves ? "Yes" : "No"}</td>
              <td>P{driver.highestPossible}</td>
              <td>P{driver.lowestPossible}</td>
            </tr>
          )
          : null
        }

      </tbody>
    </table>
  )
}