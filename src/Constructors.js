import { useState, useEffect } from 'react';
import $ from 'jquery';

export default function Constructors(props){

  const [constructorList, setConstructorList] = useState([]);
  const [pointsRemaining, setPointsRemaining] = useState(-1);
  const [pointsRemainingForSecond, setPointsRemainingForSecond] = useState(-1)
  const [racesLeft, setRacesLeft] = useState(-1)
  const [sprintsLeft, setSprintsLeft] = useState(-1)
  
  const [winningAbilityCalculated, setWinningAbilityCalculated] = useState(false)

  class ConstructorPoints{
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
    fetch ("https://ergast.com/api/f1/current/constructorStandings")
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      var x = [];
      data = $(data).find("ConstructorStanding").each((index, element) => {
        x.push(new ConstructorPoints($(element).find("Name").text(), $(element).attr("points")));
      });
      setConstructorList(x);
    })
  }

  function getPointsRemaining(schedule){
    
    var totalPointsRemaining = 0;
    var totalPointsRemainingForSecond = 0;
    var races = 0;
    var sprints = 0;
    
    $(schedule).find("Race").each((_, element) => {
      if (parseInt($(element).attr("round")) > props.mostRecentRound){
        
        totalPointsRemaining += 44;
        totalPointsRemainingForSecond += 27
        races++
        
        if ($(element).find("Sprint").length > 0){
          totalPointsRemaining += 15;
          totalPointsRemainingForSecond += 11;
          sprints++;
        }

      }
    })

    setPointsRemaining(totalPointsRemaining);
    setPointsRemainingForSecond(totalPointsRemainingForSecond);
    setRacesLeft(races)
    setSprintsLeft(sprints)
  }

  // getting a constructors highest possible position
  function highestPossiblePosition(constructor){

    function getPointsToAssign(number, pointsSet){
      while (!pointsSet.has(number) && number > 0){
        number--;
      }
      if (number <= 0){
        return Math.max(...pointsSet)
      }
      return number;
    }
    
    var tmpConstructorPoints = JSON.parse(JSON.stringify(constructorList))
    
    var totalPointsSet = [];
    for (var i = 0; i < racesLeft; i++){
      totalPointsSet.push(new Set([43,27,18,10,3]))
    }
    for (var i = 0; i < sprintsLeft; i++){
      totalPointsSet.push(new Set([15,11,7,3]))
    }
    var constructorsAssigned = new Set();

    // assigning the current constructor the maximum points from each race
    for (var pointsSet of totalPointsSet){
      var maxPoints = Math.max(...pointsSet)
      pointsSet.delete(maxPoints)
      tmpConstructorPoints.find(x => x.name == constructor.name).points += maxPoints
    }
    
    // continue until there are no more points to be given out
    var currConstructorPoints = tmpConstructorPoints.find(x => x.name == constructor.name).points;

    while(totalPointsSet.length > 0){
      var currentRacePoints = totalPointsSet.pop();
      constructorsAssigned.clear()
      constructorsAssigned.add(constructor.name)

      // for the current race, distribute the points
      while (currentRacePoints.size > 0){
        if (tmpConstructorPoints.find(x => x.points >= currConstructorPoints && !constructorsAssigned.has(x.name)))
        {
          var constructorToIncrease = tmpConstructorPoints.find(x => x.points >= currConstructorPoints && !constructorsAssigned.has(x.name))
          var pointsToAssign = getPointsToAssign(currConstructorPoints - constructorToIncrease.points, currentRacePoints)
          constructorToIncrease.points += pointsToAssign;
          currentRacePoints.delete(pointsToAssign)
          constructorsAssigned.add(constructorToIncrease.name)
        }
        else{
          // sort so that the lowest scoring constructor is first
          tmpConstructorPoints.sort((a,b) => a.points - b.points)
          var constructorToAssign = tmpConstructorPoints.find(x => !constructorsAssigned.has(x.name))
          var pointsToAssign = getPointsToAssign(currConstructorPoints - constructorToAssign.points, currentRacePoints)
          currentRacePoints.delete(pointsToAssign)
          constructorToAssign.points += pointsToAssign;
          constructorsAssigned.add(constructorToAssign.name)
        }
      }
    }

    tmpConstructorPoints.sort((a,b) => b.points - a.points)
    var currentIndex = 0;
    for (var tmpConstructor of tmpConstructorPoints){
      currentIndex++;
      if (tmpConstructor.name == constructor.name){
        constructor.highestPossible = currentIndex;
        break;
      }
    }
  }

  // getting a constructors lowest possible position
  function lowestPossiblePosition(constructor){

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
    
    var tmpConstructorPoints = JSON.parse(JSON.stringify(constructorList))
    var currConstructorPoints = tmpConstructorPoints.find(x => x.name == constructor.name).points;

    var totalPointsSet = [];
    for (var i = 0; i < racesLeft; i++){
      totalPointsSet.push(new Set([43,27,18,10,3]))
    }
    for (var i = 0; i < sprintsLeft; i++){
      totalPointsSet.push(new Set([15,11,7,3]))
    }
    var constructorsAssigned = new Set();

    // continue until there are no more points to be given out
    while(totalPointsSet.length > 0){
      var currentRacePoints = totalPointsSet.pop();
      constructorsAssigned.clear()
      constructorsAssigned.add(constructor.name)

      // for the current race, distribute the points
      while (currentRacePoints.size > 0){
        if (tmpConstructorPoints.find(x => x.points <= currConstructorPoints && !constructorsAssigned.has(x.name)))
        {
          var constructorToIncrease = tmpConstructorPoints.find(x => x.points <= currConstructorPoints && !constructorsAssigned.has(x.name))
          var pointsToAssign = getPointsToAssign(currConstructorPoints - constructorToIncrease.points, currentRacePoints)
          constructorToIncrease.points += pointsToAssign;
          currentRacePoints.delete(pointsToAssign)
          constructorsAssigned.add(constructorToIncrease.name)
        }
        else{
          if (!tmpConstructorPoints.find(x => x.points < currConstructorPoints)){
            constructor.lowestPossible = constructorList.length
            return
          }
          else{
            var pointsToAssign = getPointsToAssign(43, currentRacePoints)
            var constructorToAssign = tmpConstructorPoints.find(x => !constructorsAssigned.has(x.name))
            currentRacePoints.delete(pointsToAssign)
            constructorToAssign.points += pointsToAssign;
            constructorsAssigned.add(constructorToAssign.name)
          }
        }
      }
    }

    tmpConstructorPoints.sort((a,b) => b.points - a.points)
    var currentIndex = 0;
    for (var tmpConstructor of tmpConstructorPoints){
      currentIndex++;
      if (tmpConstructor.name == constructor.name){
        constructor.lowestPossible = currentIndex;
        break;
      }
    }
  }

  function calculateWinningAbility(){

    for (var constructor of constructorList){
      highestPossiblePosition(constructor)
      lowestPossiblePosition(constructor)
    }

    // points for the first place constructor to secure the championship
    var firstPlaceConstructor = constructorList[0]
    var secondPlaceConstructor = constructorList[1]
    var maxSecondPlacePoints = secondPlaceConstructor.points + pointsRemaining;
    firstPlaceConstructor.pointsToWin = maxSecondPlacePoints + 1 - firstPlaceConstructor.points;

    var firstPlacePoints = firstPlaceConstructor.points;
    for (var constructor of constructorList){
      if (constructor.points + pointsRemaining > firstPlacePoints + pointsRemainingForSecond){
        constructor.canWinByThemselves = true
      }
      else{
        constructor.canWinByThemselves = false;
      }
    }

    setWinningAbilityCalculated(true)
  }

  useEffect(() => {
    getData()
  }, [])

  useEffect(() => {
    if (props.mostRecentRound > 0){
      getPointsRemaining(props.schedule)
    }
  }, [props.mostRecentRound, props.schedule])

  useEffect(() => {
    if (constructorList.length > 0){
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
          ? constructorList.map((constructor, index) => 
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{constructor.name}</td>
              <td>{constructor.points}</td>
              <td>{constructor.pointsToWin == 0 ? '-' : constructor.pointsToWin}</td>
              <td className={constructor.highestPossible == 1 ? "green" : "red"}>{constructor.highestPossible == 1 ? "Yes" : "No"}</td>
              <td className={constructor.canWinByThemselves ? "green" : "red"}>{constructor.canWinByThemselves ? "Yes" : "No"}</td>
              <td>P{constructor.highestPossible}</td>
              <td>P{constructor.lowestPossible}</td>
            </tr>
          )
          : null
        }
      </tbody>
    </table>
  )
}