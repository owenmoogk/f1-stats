import { useState, useEffect } from 'react';
import $ from 'jquery';

export default function Drivers(props: {
  mostRecentRound: number,
  schedule: any
}){
  
  const [driverList, setDriverList] = useState<Driver[]>([]);
  const [pointsRemaining, setPointsRemaining] = useState<number>(-1);
  const [pointsRemainingForSecond, setPointsRemainingForSecond] = useState<number>(-1)
  const [racesLeft, setRacesLeft] = useState<number>(-1)
  const [sprintsLeft, setSprintsLeft] = useState<number>(-1)

  const [winningAbilityCalculated, setWinningAbilityCalculated] = useState<boolean>(false)
  
  class Driver{
    name = ""
    points = -1
    canWinByThemselves = false
    highestPossible = -1
    lowestPossible = -1

    constructor(name: string, points: number){
      this.name = name
      this.points = points
    }
  }
  
  function getData(){
    fetch ("https://ergast.com/api/f1/current/driverStandings")
    .then(response => response.text())
    .then(text => new window.DOMParser().parseFromString(text, "text/xml"))
    .then(xml => {
      var tmpDrivers: Driver[] = [];
      $(xml).find("DriverStanding").each((_, driver) => {
        var driverInfo = $(driver).find("Driver")
        var driverElement = $(driver)
        tmpDrivers.push(new Driver(driverInfo.find("GivenName").text() + " " + driverInfo.find("FamilyName").text(), parseInt(driverElement.attr("points") ?? "0")))
      })
      setDriverList(tmpDrivers);
    })
  }

  function getPointsRemaining(schedule: any){
    
    var totalPointsRemaining = 0;
    var totalPointsRemainingForSecond = 0;
    var races = 0;
    var sprints = 0;
    
    $(schedule).find("Race").each((_, element) => {
      if (parseInt($(element).attr("round") ?? "0") > props.mostRecentRound){
        
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
  function highestPossiblePosition(driver: Driver){

    function getPointsToAssign(number: number, pointsSet: any){
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
      totalPointsSet.push(new Set([26,18,15,12,10,8,6,4,2,1]))
    }
    for (var i = 0; i < sprintsLeft; i++){
      totalPointsSet.push(new Set([8,7,6,5,4,3,2,1]))
    }
    var driversAssigned = new Set();

    // assigning the current driver the maximum points from each race
    for (var pointsSet of totalPointsSet){
      var maxPoints = Math.max(...pointsSet)
      pointsSet.delete(maxPoints)
      tmpDriverPoints.find((x: Driver) => x.name == driver.name).points += maxPoints
    }
    
    // continue until there are no more points to be given out
    var currDriverPoints = tmpDriverPoints.find((x: Driver) => x.name == driver.name).points;

    while(totalPointsSet.length > 0){
      var currentRacePoints = totalPointsSet.pop() ?? new Set();
      driversAssigned.clear()
      driversAssigned.add(driver.name)

      // for the current race, distribute the points
      while (currentRacePoints.size > 0){
        if (tmpDriverPoints.find((x: Driver) => x.points >= currDriverPoints && !driversAssigned.has(x.name)))
        {
          var driverToIncrease = tmpDriverPoints.find((x: Driver) => x.points >= currDriverPoints && !driversAssigned.has(x.name))
          var pointsToAssign = getPointsToAssign(currDriverPoints - driverToIncrease.points, currentRacePoints)
          driverToIncrease.points += pointsToAssign;
          currentRacePoints.delete(pointsToAssign)
          driversAssigned.add(driverToIncrease.name)
        }
        else{
          // sort so that the lowest scoring driver is first
          tmpDriverPoints.sort((a: Driver, b: Driver) => a.points - b.points)
          var driverToAssign = tmpDriverPoints.find((x: Driver) => !driversAssigned.has(x.name))
          var pointsToAssign = getPointsToAssign(currDriverPoints - driverToAssign.points, currentRacePoints)
          currentRacePoints.delete(pointsToAssign)
          driverToAssign.points += pointsToAssign;
          driversAssigned.add(driverToAssign.name)
        }
      }
    }

    tmpDriverPoints.sort((a: Driver, b: Driver) => b.points - a.points)
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
  function lowestPossiblePosition(driver: Driver){

    function getPointsToAssign(pointsDiff: number, pointsSet: any){
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
    var currDriverPoints = tmpDriverPoints.find((x: Driver) => x.name == driver.name).points;

    // var totalPointsSet = new Array(racesLeft).fill(racePointsSet).concat(new Array(sprintsLeft).fill(sprintPointsSet));
    var totalPointsSet = [];
    for (var i = 0; i < racesLeft; i++){
      totalPointsSet.push(new Set([26,18,15,12,10,8,6,4,2,1]))
    }
    for (var i = 0; i < sprintsLeft; i++){
      totalPointsSet.push(new Set([8,7,6,5,4,3,2,1]))
    }
    var driversAssigned = new Set();

    // continue until there are no more points to be given out
    while(totalPointsSet.length > 0){
      var currentRacePoints = totalPointsSet.pop() ?? new Set();
      driversAssigned.clear()
      driversAssigned.add(driver.name)

      // for the current race, distribute the points
      while (currentRacePoints.size > 0){
        if (tmpDriverPoints.find((x: Driver) => x.points <= currDriverPoints && !driversAssigned.has(x.name)))
        {
          var driverToIncrease = tmpDriverPoints.find((x: Driver) => x.points <= currDriverPoints && !driversAssigned.has(x.name))
          var pointsToAssign = getPointsToAssign(currDriverPoints - driverToIncrease.points, currentRacePoints)
          driverToIncrease.points += pointsToAssign;
          currentRacePoints.delete(pointsToAssign)
          driversAssigned.add(driverToIncrease.name)
        }
        else{
          if (!tmpDriverPoints.find((x: Driver) => x.points < currDriverPoints)){
            driver.lowestPossible = driverList.length
            return
          }
          else{
            var pointsToAssign = getPointsToAssign(25, currentRacePoints)
            var driverToAssign = tmpDriverPoints.find((x: Driver) => !driversAssigned.has(x.name))
            currentRacePoints.delete(pointsToAssign)
            driverToAssign.points += pointsToAssign;
            driversAssigned.add(driverToAssign.name)
          }
        }
      }
    }

    tmpDriverPoints.sort((a: Driver, b: Driver) => b.points - a.points)
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