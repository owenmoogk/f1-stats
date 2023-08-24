import { useState, useEffect } from 'react';
import $ from 'jquery';

export default function Drivers(){
  const [driverList, setDriverList] = useState([]);
  const [pointsRemaining, setPointsRemaining] = useState(-1);
  const [sumPoints, setSumPoints] = useState(-1);
  const [pointsRemainingForSecond, setPointsRemainingForSecond] = useState(-1)
  const [mostRecentRound, setMostRecentRound] = useState(-1);
  const [racesLeft, setRacesLeft] = useState(-1)
  const [sprintsLeft, setSprintsLeft] = useState(-1)

  const [winningAbilityCalculated, setWinningAbilityCalculated] = useState(false)
  
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
  
  function getData(){
    fetch ("http://ergast.com/api/f1/current/driverStandings")
    .then(response => response.text())
    .then(text => new window.DOMParser().parseFromString(text, "text/xml"))
    .then(xml => {
      var tmpDrivers = [];
      $(xml).find("DriverStanding").each((_, driver) => {
        var driverInfo = $(driver).find("Driver")
        driver = $(driver)
        tmpDrivers.push(new DriverPoints(driverInfo.find("GivenName").text() + " " + driverInfo.find("FamilyName").text(), driver.attr("points")))
      })
      setDriverList(tmpDrivers);
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
      var sumPointsCalculated = 0;
      var races = 0;
      var sprints = 0;
      $(data).find("Race").each((index, element) => {
        if (parseInt($(element).attr("round")) > mostRecentRound){
          totalPointsRemaining += 26;
          totalPointsRemainingForSecond += 18
          races++;
          sumPointsCalculated += pointsPerRace
          if ($(element).find("Sprint").length > 0){
            totalPointsRemaining += 8;
            sprints++;
            totalPointsRemainingForSecond += 7
            sumPointsCalculated += pointsPerSprint;
          }
        }
      })
      setSumPoints(sumPointsCalculated)
      setPointsRemaining(totalPointsRemaining);
      setPointsRemainingForSecond(totalPointsRemainingForSecond);
      setRacesLeft(races)
      setSprintsLeft(sprints)
    })
  }

  // getting a drivers highest possible position
  function highestPossiblePosition(){
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
          if (driver.highestPossible == 1){
            driver.canWin = true;
          }
          break;
        }
      }      
    }
  }

  function roundUpToNearestPoints(number, pointsSet){
    while (!pointsSet.has(number) && number < 25){
      number++;
    }
    if (number >= 25){
      return Math.max(...pointsSet)
    }
    return number;
  }

  // getting a drivers lowest possible position
  function lowestPossiblePosition(driver){
    
    var tmpDriverPoints = JSON.parse(JSON.stringify(driverList))
    var currDriverPoints = tmpDriverPoints.find(x => x.name == driver.name).points;

    var racePointsSet = new Set([25,18,15,12,10,8,6,4,2,1]);
    var sprintPointsSet = new Set([8,7,6,5,4,3,2,1])
    // var totalPointsSet = new Array(racesLeft).fill(racePointsSet).concat(new Array(sprintsLeft).fill(sprintPointsSet));
    var totalPointsSet = [];
    for (var i = 0; i < racesLeft; i++){
      totalPointsSet.push(new Set([25,18,15,12,10,8,6,4,2,1]))
    }
    for (var i = 0; i < sprintsLeft; i++){
      totalPointsSet.push(new Set([8,7,6,5,4,3,2,1]))
    }
    var driversAssigned = new Set();

    // continue until there are no more points to be given out
    while(totalPointsSet.length > 0){
      var currentRacePoints = totalPointsSet.pop();
      driversAssigned.clear()
      driversAssigned.add(driver.name)

      // for the current race, distribute the points
      while (currentRacePoints.size > 0){
        if (tmpDriverPoints.find(x => x.points <= currDriverPoints && !driversAssigned.has(x.name)))
        {
          var driverToIncrease = tmpDriverPoints.find(x => x.points <= currDriverPoints && !driversAssigned.has(x.name))
          var pointsToAssign = roundUpToNearestPoints(currDriverPoints - driverToIncrease.points, currentRacePoints)
          driverToIncrease.points += pointsToAssign;
          currentRacePoints.delete(pointsToAssign)
          driversAssigned.add(driverToIncrease.name)
        }
        else{
          if (!tmpDriverPoints.find(x => x.points < currDriverPoints)){
            driver.lowestPossible = driverList.length
            return
          }
          else{
            var pointsToAssign = roundUpToNearestPoints(25, currentRacePoints)
            var driverToAssign = tmpDriverPoints.find(x => !driversAssigned.has(x.name))
            currentRacePoints.delete(pointsToAssign)
            driverToAssign.points += pointsToAssign;
            driversAssigned.add(driverToAssign.name)
          }
        }
      }
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

  function calculateWinningAbility(){
    
    // we want to calculate the lowest possible position for each driver
    for (var driver of driverList){
      highestPossiblePosition(driver)
      lowestPossiblePosition(driver)
    }

    // points for the first place driver to secure championship
    var firstPlaceDriver = driverList[0]
    var secondPlaceDriver = driverList[1]
    var maxSecondPlacePoints = secondPlaceDriver.points + pointsRemaining;
    firstPlaceDriver.pointsToWin = maxSecondPlacePoints + 1 - firstPlaceDriver.points;
    
    // if a driver can win on pure performance
    var firstPlacePoints = driverList[0].points;
    for (var driver of driverList){
      if (driver.points + pointsRemaining > firstPlacePoints + pointsRemainingForSecond){
        driver.canWinByThemselves = true
      }
      else{
        driver.canWinByThemselves = false;
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