import { useState, useEffect } from 'react';
import $ from 'jquery';

export default function Drivers(props){
  
  const [driverList, setDriverList] = useState([]);
  const [pointsRemaining, setPointsRemaining] = useState(-1);
  const [pointsRemainingForSecond, setPointsRemainingForSecond] = useState(-1)
  const [racesLeft, setRacesLeft] = useState(-1)
  const [sprintsLeft, setSprintsLeft] = useState(-1)

  const [winningAbilityCalculated, setWinningAbilityCalculated] = useState(false)
  
  class DriverPoints{
    name = ""
    points = -1
    pointsToWin = 0
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

  function getPointsRemaining(schedule){
    
    var totalPointsRemaining = 0;
    var totalPointsRemainingForSecond = 0;
    var races = 0;
    var sprints = 0;
    
    $(schedule).find("Race").each((_, element) => {
      if (parseInt($(element).attr("round")) > props.mostRecentRound){
        
        totalPointsRemaining += 26;
        totalPointsRemainingForSecond += 18
        races++;
        
        if ($(element).find("Sprint").length > 0){
          totalPointsRemaining += 8;
          totalPointsRemainingForSecond += 7
          sprints++;
        }

      }
    })

    setPointsRemaining(totalPointsRemaining);
    setPointsRemainingForSecond(totalPointsRemainingForSecond);
    setRacesLeft(races)
    setSprintsLeft(sprints)
  }

  // getting a drivers highest possible position
  function highestPossiblePosition(driver){

    function getPointsToAssign(number, pointsSet){
      while (!pointsSet.has(number) && number > 0){
        number--;
      }
      if (number <= 0){
        return Math.max(...pointsSet)
      }
      return number;
    }
    
    var tmpDriverPoints = JSON.parse(JSON.stringify(driverList))
    
    var totalPointsSet = [];
    for (var i = 0; i < racesLeft; i++){
      totalPointsSet.push(new Set([25,18,15,12,10,8,6,4,2,1]))
    }
    for (var i = 0; i < sprintsLeft; i++){
      totalPointsSet.push(new Set([8,7,6,5,4,3,2,1]))
    }
    var driversAssigned = new Set();

    // assigning the current driver the maximum points from each race
    for (var pointsSet of totalPointsSet){
      var maxPoints = Math.max(...pointsSet)
      pointsSet.delete(maxPoints)
      tmpDriverPoints.find(x => x.name == driver.name).points += maxPoints
    }
    
    // continue until there are no more points to be given out
    var currDriverPoints = tmpDriverPoints.find(x => x.name == driver.name).points;

    while(totalPointsSet.length > 0){
      var currentRacePoints = totalPointsSet.pop();
      driversAssigned.clear()
      driversAssigned.add(driver.name)

      // for the current race, distribute the points
      while (currentRacePoints.size > 0){
        if (tmpDriverPoints.find(x => x.points >= currDriverPoints && !driversAssigned.has(x.name)))
        {
          var driverToIncrease = tmpDriverPoints.find(x => x.points >= currDriverPoints && !driversAssigned.has(x.name))
          var pointsToAssign = getPointsToAssign(currDriverPoints - driverToIncrease.points, currentRacePoints)
          driverToIncrease.points += pointsToAssign;
          currentRacePoints.delete(pointsToAssign)
          driversAssigned.add(driverToIncrease.name)
        }
        else{
          // sort so that the lowest scoring driver is first
          tmpDriverPoints.sort((a,b) => a.points - b.points)
          var driverToAssign = tmpDriverPoints.find(x => !driversAssigned.has(x.name))
          var pointsToAssign = getPointsToAssign(currDriverPoints - driverToAssign.points, currentRacePoints)
          currentRacePoints.delete(pointsToAssign)
          driverToAssign.points += pointsToAssign;
          driversAssigned.add(driverToAssign.name)
        }
      }
    }

    tmpDriverPoints.sort((a,b) => b.points - a.points)
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
  function lowestPossiblePosition(driver){

    function getPointsToAssign(pointsDiff, pointsSet){
      var number = pointsDiff + 1;
      while (!pointsSet.has(number) && number < 25){
        number++;
      }
      if (number >= 25){
        return Math.max(...pointsSet)
      }
      return number;
    }
    
    var tmpDriverPoints = JSON.parse(JSON.stringify(driverList))
    var currDriverPoints = tmpDriverPoints.find(x => x.name == driver.name).points;

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
          var pointsToAssign = getPointsToAssign(currDriverPoints - driverToIncrease.points, currentRacePoints)
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
            var pointsToAssign = getPointsToAssign(25, currentRacePoints)
            var driverToAssign = tmpDriverPoints.find(x => !driversAssigned.has(x.name))
            currentRacePoints.delete(pointsToAssign)
            driverToAssign.points += pointsToAssign;
            driversAssigned.add(driverToAssign.name)
          }
        }
      }
    }

    tmpDriverPoints.sort((a,b) => b.points - a.points)
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
    
    var firstPlacePoints = firstPlaceDriver.points;
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
  }, [])

  useEffect(() => {
    if (props.mostRecentRound > -1){
      getPointsRemaining(props.schedule)
    }
  }, [props.mostRecentRound, props.schedule])

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
              <td className={driver.highestPossible == 1 ? "green" : "red"}>{driver.highestPossible == 1 ? "Yes" : "No"}</td>
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