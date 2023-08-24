import { useState, useEffect } from 'react';
import $ from 'jquery';

export default function Constructors(props){
  const [constructorList, setConstructorList] = useState([]);
  const [pointsRemaining, setPointsRemaining] = useState(-1);
  const [pointsRemainingForSecond, setPointsRemainingForSecond] = useState(-1)
  const [sumPoints, setSumPoints] = useState(-1)
  const [winningAbilityCalculated, setWinningAbilityCalculated] = useState(false)

  class ConstructorPoints{
    name = ""
    points = -1
    pointsToWin = 0
    canWin = false
    canWinByThemselves = false
    highestPossible = -1
    lowestPossible = -1

    constructor(name, points){
      this.name = name
      this.points = points
    }
  }
  
  function saveConstructors(data){
    var x = [];
    data = $(data).find("ConstructorStanding").each((index, element) => {
      x.push(new ConstructorPoints($(element).find("Name").text(), parseInt($(element).attr("points"))));
    });
    setConstructorList(x);
  }
  
  function getData(){
    fetch ("http://ergast.com/api/f1/current/constructorStandings")
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      saveConstructors(data)
    })
  }

  function getPointsRemaining(schedule){
    var totalPointsRemaining = 0;
    var totalPointsRemainingForSecond = 0;
    var sumPointsCalculated = 0;
    $(schedule).find("Race").each((index, element) => {
      if (parseInt($(element).attr("round")) > props.mostRecentRound){
        totalPointsRemaining += 44;
        totalPointsRemainingForSecond += 27
        sumPointsCalculated += 102
        if ($(element).find("Sprint").length > 0){
          totalPointsRemaining += 15;
          totalPointsRemainingForSecond += 11;
          sumPointsCalculated += 36
        }
      }
    })
    setSumPoints(sumPointsCalculated)
    setPointsRemaining(totalPointsRemaining);
    setPointsRemainingForSecond(totalPointsRemainingForSecond);
  }

  function calculateWinningAbility(){
    var firstPlaceConstructor = constructorList[0]
    var secondPlaceConstructor = constructorList[1]
    var maxSecondPlacePoints = secondPlaceConstructor.points + pointsRemaining;
    firstPlaceConstructor.pointsToWin = maxSecondPlacePoints + 1 - firstPlaceConstructor.points;

    var firstPlacePoints = firstPlaceConstructor.points;
    for (var constructor of constructorList){
      if (constructor.points + pointsRemaining < firstPlacePoints){
        constructor.canWin = false
      }
      else{
        constructor.canWin = true;
      }
    }

    for (var constructor of constructorList){
      if (constructor.points + pointsRemaining > firstPlacePoints + pointsRemainingForSecond){
        constructor.canWinByThemselves = true
      }
      else{
        constructor.canWinByThemselves = false;
      }
    }

    // getting a constructors highest possible position
    for (var constructor of constructorList){
      
      var tmpConstructorPoints = JSON.parse(JSON.stringify(constructorList))
      var pointsPool = sumPoints;
      
      tmpConstructorPoints.find(x => x.name == constructor.name).points += pointsRemaining;
      pointsPool -= pointsRemaining;

      var currConstructorPoints = tmpConstructorPoints.find(x => x.name == constructor.name).points;
      while(pointsPool > 0){
        if (tmpConstructorPoints.find(x => x.points + 1 < currConstructorPoints || x.points > currConstructorPoints))
        {
          tmpConstructorPoints.find(x => x.points + 1 < currConstructorPoints || x.points > currConstructorPoints).points += 1;
        }
        else{
          tmpConstructorPoints.find(x => x.points == currConstructorPoints || x.points == currConstructorPoints - 1).points += 1;
        }
        pointsPool -= 1
      }

      tmpConstructorPoints = tmpConstructorPoints.sort((a,b) => b.points- a.points)
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
    for (var constructor of constructorList){
      
      var tmpConstructorPoints = JSON.parse(JSON.stringify(constructorList))
      var pointsPool = sumPoints;

      var currConstructorPoints = tmpConstructorPoints.find(x => x.name == constructor.name).points;
      while(pointsPool > 0){
        if (tmpConstructorPoints.find(x => x.points <= currConstructorPoints && x.name != constructor.name))
        {
          tmpConstructorPoints.find(x => x.points <= currConstructorPoints && x.name != constructor.name).points += 1;
        }
        pointsPool -= 1
      }

      tmpConstructorPoints = tmpConstructorPoints.sort((a,b) => b.points - a.points)
      var currentIndex = 0;
      for (var tmpConstructor of tmpConstructorPoints){
        currentIndex++;
        if (tmpConstructor.name == constructor.name){
          constructor.lowestPossible = currentIndex;
          break;
        }
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
              <td className={constructor.canWin ? "green" : "red"}>{constructor.canWin ? "Yes" : "No"}</td>
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