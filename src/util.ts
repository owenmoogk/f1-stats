import $ from 'jquery';
import { Constructor, Driver, Scorer } from './types';

export type PointsData = {
	driverPoints: number,
	driverPointsForSecond: number,
	constructorPoints: number,
	constructorPointsForSecond: number,
	racesLeft: number,
	sprintsLeft: number
}

export function getPointsRemaining(schedule: XMLDocument, mostRecentRound: number) {

	var constructorPoints = 0;
	var constructorPointsForSecond = 0;
	var driverPoints = 0;
	var driverPointsForSecond = 0;
	var racesLeft = 0;
	var sprintsLeft = 0;

	$(schedule).find("Race").each((_, element) => {
		if (parseInt($(element).attr("round") ?? "0") > mostRecentRound) {

			constructorPoints += 44;
			constructorPointsForSecond += 27
			driverPoints += 26
			driverPointsForSecond += 18
			racesLeft++

			if ($(element).find("Sprint").length > 0) {
				constructorPoints += 15;
				constructorPointsForSecond += 11;
				driverPoints += 8
				driverPointsForSecond += 7
				sprintsLeft++;
			}

		}
	})
	var returnData: PointsData = {
		constructorPoints,
		constructorPointsForSecond,
		driverPoints,
		driverPointsForSecond,
		racesLeft,
		sprintsLeft
	}
	return returnData
}

export function calculateWinningAbility(scorerList: Scorer[], pointsRemaining: number, pointsRemainingForSecond: number, racesLeft: number, sprintsLeft: number) {
	for (var scorer of scorerList) {
		highestPossiblePosition(scorer, scorerList, racesLeft, sprintsLeft)
		lowestPossiblePosition(scorer, scorerList, racesLeft, sprintsLeft)
	}

	// points for the first place constructor to secure the championship
	var firstPlaceScorer = scorerList[0]
	var firstPlacePoints = firstPlaceScorer.points;
	for (var scorer of scorerList) {
		if (scorer.points + pointsRemaining > firstPlacePoints + pointsRemainingForSecond) {
			scorer.canWinByThemselves = true
		}
		else {
			scorer.canWinByThemselves = false;
		}
	}

	return scorerList
}

const constructorMaxPoints = [44, 27, 18, 10, 3]
const constructorMaxSprintPoints = [15, 11, 7, 3]

const driverMaxPoints = [26, 18, 15, 12, 10, 8, 6, 4, 2, 1]
const driverMaxSprintPoints = [8, 7, 6, 5, 4, 3, 2, 1]

function highestPossiblePosition(scorer: Scorer, scorerList: Scorer[], racesLeft: number, sprintsLeft: number) {

	function getPointsToAssign(number: number, pointsSet: any) {
		while (!pointsSet.has(number) && number > 0) {
			number--;
		}
		if (number <= 0) {
			return Math.max(...pointsSet)
		}
		return number;
	}

	var tmpScorerPoints = JSON.parse(JSON.stringify(scorerList))

	var totalPointsSet: Set<number>[] = [];
	for (var i = 0; i < racesLeft; i++) {
		if (scorer instanceof Driver){
			totalPointsSet.push(new Set(driverMaxPoints))
		}
		else if (scorer instanceof Constructor){
			totalPointsSet.push(new Set(constructorMaxPoints))
		}
	}
	for (var i = 0; i < sprintsLeft; i++) {
		if (scorer instanceof Driver){
			totalPointsSet.push(new Set(driverMaxSprintPoints))
		}
		else if (scorer instanceof Constructor){
			totalPointsSet.push(new Set(constructorMaxSprintPoints))
		}
	}
	var constructorsAssigned = new Set();

	// assigning the current constructor the maximum points from each race
	for (var pointsSet of totalPointsSet) {
		var maxPoints = Math.max(...pointsSet)
		pointsSet.delete(maxPoints)
		tmpScorerPoints.find((x: Scorer) => x.name === scorer.name).points += maxPoints
	}

	// continue until there are no more points to be given out
	var currConstructorPoints = tmpScorerPoints.find((x: Scorer) => x.name === scorer.name).points;

	while (totalPointsSet.length > 0) {
		var currentRacePoints = totalPointsSet.pop() ?? new Set();
		constructorsAssigned.clear()
		constructorsAssigned.add(scorer.name)

		// for the current race, distribute the points
		while (currentRacePoints.size > 0) {
			if (tmpScorerPoints.find((x: Scorer) => x.points >= currConstructorPoints && !constructorsAssigned.has(x.name))) {
				var constructorToIncrease = tmpScorerPoints.find((x: Scorer) => x.points >= currConstructorPoints && !constructorsAssigned.has(x.name))
				var pointsToAssign = getPointsToAssign(currConstructorPoints - constructorToIncrease.points, currentRacePoints)
				constructorToIncrease.points += pointsToAssign;
				currentRacePoints.delete(pointsToAssign)
				constructorsAssigned.add(constructorToIncrease.name)
			}
			else {
				// sort so that the lowest scoring constructor is first
				tmpScorerPoints.sort((a: Scorer, b: Scorer) => a.points - b.points)
				var constructorToAssign = tmpScorerPoints.find((x: Scorer) => !constructorsAssigned.has(x.name))
				var pointsToAssign = getPointsToAssign(currConstructorPoints - constructorToAssign.points, currentRacePoints)
				currentRacePoints.delete(pointsToAssign)
				constructorToAssign.points += pointsToAssign;
				constructorsAssigned.add(constructorToAssign.name)
			}
		}
	}

	tmpScorerPoints.sort((a: Scorer, b: Scorer) => b.points - a.points)
	var currentIndex = 0;
	for (var tmpConstructor of tmpScorerPoints) {
		currentIndex++;
		if (tmpConstructor.name === scorer.name) {
			scorer.highestPossible = currentIndex;
			break;
		}
	}
}

function lowestPossiblePosition(scorer: Scorer, scorerList: Scorer[], racesLeft: number, sprintsLeft: number) {

	function getPointsToAssign(pointsDiff: number, pointsSet: any) {
		var number = pointsDiff + 1;
		while (!pointsSet.has(number) && number < 25) {
			number++;
		}
		if (number >= 25) {
			return Math.max(...pointsSet)
		}
		return number;
	}

	var tmpScorerPoints = JSON.parse(JSON.stringify(scorerList))
	var currScorerPoints = tmpScorerPoints.find((x: Scorer) => x.name === scorer.name).points;

	var totalPointsSet = [];
	for (var i = 0; i < racesLeft; i++) {
		if (scorer instanceof Driver){
			totalPointsSet.push(new Set(driverMaxPoints))
		}
		else if (scorer instanceof Constructor){
			totalPointsSet.push(new Set(constructorMaxPoints))
		}
	}
	for (var i = 0; i < sprintsLeft; i++) {
		if (scorer instanceof Driver){
			totalPointsSet.push(new Set(driverMaxPoints))
		}
		else if (scorer instanceof Constructor){
			totalPointsSet.push(new Set(constructorMaxPoints))
		}
	}
	var constructorsAssigned = new Set();

	// continue until there are no more points to be given out
	while (totalPointsSet.length > 0) {
		var currentRacePoints = totalPointsSet.pop() ?? new Set();
		constructorsAssigned.clear()
		constructorsAssigned.add(scorer.name)

		// for the current race, distribute the points
		while (currentRacePoints.size > 0) {
			if (tmpScorerPoints.find((x: Scorer) => x.points <= currScorerPoints && !constructorsAssigned.has(x.name))) {
				var constructorToIncrease = tmpScorerPoints.find((x: Scorer) => x.points <= currScorerPoints && !constructorsAssigned.has(x.name))
				var pointsToAssign = getPointsToAssign(currScorerPoints - constructorToIncrease.points, currentRacePoints)
				constructorToIncrease.points += pointsToAssign;
				currentRacePoints.delete(pointsToAssign)
				constructorsAssigned.add(constructorToIncrease.name)
			}
			else {
				if (!tmpScorerPoints.find((x: Scorer) => x.points < currScorerPoints)) {
					scorer.lowestPossible = scorerList.length
					return
				}
				else {
					var pointsToAssign = getPointsToAssign(43, currentRacePoints)
					var constructorToAssign = tmpScorerPoints.find((x: Scorer) => !constructorsAssigned.has(x.name))
					currentRacePoints.delete(pointsToAssign)
					constructorToAssign.points += pointsToAssign;
					constructorsAssigned.add(constructorToAssign.name)
				}
			}
		}
	}

	tmpScorerPoints.sort((a: Scorer, b: Scorer) => b.points - a.points)
	var currentIndex = 0;
	for (var tmpConstructor of tmpScorerPoints) {
		currentIndex++;
		if (tmpConstructor.name === scorer.name) {
			scorer.lowestPossible = currentIndex;
			break;
		}
	}
}

