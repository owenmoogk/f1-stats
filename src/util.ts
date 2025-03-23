import type { Race } from './api';
import type { Scorer } from './types';
import { Constructor, Driver } from './types';

export type PointsData = {
  driverPoints: number;
  driverPointsForSecond: number;
  constructorPoints: number;
  constructorPointsForSecond: number;
  racesLeft: number;
  sprintsLeft: number;
};

export function getPointsRemaining(schedule: Race[], mostRecentRound: number) {
  let constructorPoints = 0;
  let constructorPointsForSecond = 0;
  let driverPoints = 0;
  let driverPointsForSecond = 0;
  let racesLeft = 0;
  let sprintsLeft = 0;

  schedule.forEach((race) => {
    if (race.round > mostRecentRound) {
      constructorPoints += 44;
      constructorPointsForSecond += 27;
      driverPoints += 26;
      driverPointsForSecond += 18;
      racesLeft++;

      if (race.Sprint) {
        constructorPoints += 15;
        constructorPointsForSecond += 11;
        driverPoints += 8;
        driverPointsForSecond += 7;
        sprintsLeft++;
      }
    }
  });
  const returnData: PointsData = {
    constructorPoints,
    constructorPointsForSecond,
    driverPoints,
    driverPointsForSecond,
    racesLeft,
    sprintsLeft,
  };
  return returnData;
}

export function calculateWinningAbility(
  scorerList: Scorer[],
  pointsRemaining: number,
  pointsRemainingForSecond: number,
  racesLeft: number,
  sprintsLeft: number
) {
  for (const scorer of scorerList) {
    highestPossiblePosition(scorer, scorerList, racesLeft, sprintsLeft);
    lowestPossiblePosition(scorer, scorerList, racesLeft, sprintsLeft);
  }

  // points for the first place constructor to secure the championship
  const firstPlaceScorer = scorerList[0];
  const firstPlacePoints = firstPlaceScorer.points;
  for (const scorer of scorerList) {
    if (
      scorer.points + pointsRemaining >
      firstPlacePoints + pointsRemainingForSecond
    ) {
      scorer.canWinByThemselves = true;
    } else {
      scorer.canWinByThemselves = false;
    }
  }

  return scorerList;
}

const constructorMaxPoints = [43, 27, 18, 10, 3];
const constructorMaxSprintPoints = [15, 11, 7, 3];

const driverMaxPoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const driverMaxSprintPoints = [8, 7, 6, 5, 4, 3, 2, 1];

function highestPossiblePosition(
  scorer: Scorer,
  scorerList: Scorer[],
  racesLeft: number,
  sprintsLeft: number
) {
  function getPointsToAssign(number: number, pointsSet: Set<number>) {
    while (!pointsSet.has(number) && number > 0) {
      number--;
    }
    if (number <= 0) {
      return Math.max(...pointsSet);
    }
    return number;
  }

  const tmpScorerPoints = JSON.parse(JSON.stringify(scorerList)) as Scorer[];

  const totalPointsSet: Set<number>[] = [];
  for (let i = 0; i < racesLeft; i++) {
    if (scorer instanceof Driver) {
      totalPointsSet.push(new Set(driverMaxPoints));
    } else if (scorer instanceof Constructor) {
      totalPointsSet.push(new Set(constructorMaxPoints));
    }
  }
  for (let i = 0; i < sprintsLeft; i++) {
    if (scorer instanceof Driver) {
      totalPointsSet.push(new Set(driverMaxSprintPoints));
    } else if (scorer instanceof Constructor) {
      totalPointsSet.push(new Set(constructorMaxSprintPoints));
    }
  }
  const constructorsAssigned = new Set();

  // assigning the current constructor the maximum points from each race
  for (const pointsSet of totalPointsSet) {
    const maxPoints = Math.max(...pointsSet);
    pointsSet.delete(maxPoints);
    const tmpScorer = tmpScorerPoints.find(
      (x: Scorer) => x.name === scorer.name
    );
    if (tmpScorer) {
      tmpScorer.points += maxPoints;
    }
  }

  // continue until there are no more points to be given out
  const currConstructorPoints = tmpScorerPoints.find(
    (x: Scorer) => x.name === scorer.name
  )?.points;
  if (currConstructorPoints === undefined) throw Error();

  while (totalPointsSet.length > 0) {
    const currentRacePoints = totalPointsSet.pop() ?? new Set();
    constructorsAssigned.clear();
    constructorsAssigned.add(scorer.name);

    // for the current race, distribute the points
    while (currentRacePoints.size > 0) {
      if (
        tmpScorerPoints.find(
          (x: Scorer) =>
            x.points >= currConstructorPoints &&
            !constructorsAssigned.has(x.name)
        )
      ) {
        const constructorToIncrease = tmpScorerPoints.find(
          (x: Scorer) =>
            x.points >= currConstructorPoints &&
            !constructorsAssigned.has(x.name)
        );
        if (!constructorToIncrease) throw Error();
        const pointsToAssign = getPointsToAssign(
          currConstructorPoints - constructorToIncrease.points,
          currentRacePoints
        );
        constructorToIncrease.points += pointsToAssign;
        currentRacePoints.delete(pointsToAssign);
        constructorsAssigned.add(constructorToIncrease.name);
      } else {
        // sort so that the lowest scoring constructor is first
        tmpScorerPoints.sort((a: Scorer, b: Scorer) => a.points - b.points);
        const constructorToAssign = tmpScorerPoints.find(
          (x: Scorer) => !constructorsAssigned.has(x.name)
        );
        if (!constructorToAssign) throw Error();
        const pointsToAssign = getPointsToAssign(
          currConstructorPoints - constructorToAssign.points,
          currentRacePoints
        );
        currentRacePoints.delete(pointsToAssign);
        constructorToAssign.points += pointsToAssign;
        constructorsAssigned.add(constructorToAssign.name);
      }
    }
  }

  tmpScorerPoints.sort((a: Scorer, b: Scorer) => b.points - a.points);
  let currentIndex = 0;
  for (const tmpConstructor of tmpScorerPoints) {
    currentIndex++;
    if (tmpConstructor.name === scorer.name) {
      scorer.highestPossible = currentIndex;
      break;
    }
  }
}

function lowestPossiblePosition(
  scorer: Scorer,
  scorerList: Scorer[],
  racesLeft: number,
  sprintsLeft: number
) {
  function getPointsToAssign(pointsDiff: number, pointsSet: Set<number>) {
    let number = pointsDiff + 1;
    while (!pointsSet.has(number) && number < 25) {
      number++;
    }
    if (number >= 25) {
      return Math.max(...pointsSet);
    }
    return number;
  }

  const tmpScorerPoints = JSON.parse(JSON.stringify(scorerList)) as Scorer[];
  const currScorerPoints = tmpScorerPoints.find(
    (x) => x.name === scorer.name
  )?.points;

  if (currScorerPoints === undefined) throw Error();

  const totalPointsSet = [];
  for (let i = 0; i < racesLeft; i++) {
    if (scorer instanceof Driver) {
      totalPointsSet.push(new Set(driverMaxPoints));
    } else if (scorer instanceof Constructor) {
      totalPointsSet.push(new Set(constructorMaxPoints));
    }
  }
  for (let i = 0; i < sprintsLeft; i++) {
    if (scorer instanceof Driver) {
      totalPointsSet.push(new Set(driverMaxSprintPoints));
    } else if (scorer instanceof Constructor) {
      totalPointsSet.push(new Set(constructorMaxSprintPoints));
    }
  }
  const constructorsAssigned = new Set();

  // continue until there are no more points to be given out
  while (totalPointsSet.length > 0) {
    const currentRacePoints = totalPointsSet.pop() ?? new Set();
    constructorsAssigned.clear();
    constructorsAssigned.add(scorer.name);

    // for the current race, distribute the points
    while (currentRacePoints.size > 0) {
      if (
        tmpScorerPoints.find(
          (x: Scorer) =>
            x.points <= currScorerPoints && !constructorsAssigned.has(x.name)
        )
      ) {
        const constructorToIncrease = tmpScorerPoints.find(
          (x: Scorer) =>
            x.points <= currScorerPoints && !constructorsAssigned.has(x.name)
        );
        if (!constructorToIncrease) throw Error();
        const pointsToAssign = getPointsToAssign(
          currScorerPoints - constructorToIncrease.points,
          currentRacePoints
        );
        constructorToIncrease.points += pointsToAssign;
        currentRacePoints.delete(pointsToAssign);
        constructorsAssigned.add(constructorToIncrease.name);
      } else {
        if (!tmpScorerPoints.find((x: Scorer) => x.points < currScorerPoints)) {
          scorer.lowestPossible = scorerList.length;
          return scorer.lowestPossible;
        } else {
          const pointsToAssign = getPointsToAssign(43, currentRacePoints);
          const constructorToAssign = tmpScorerPoints.find(
            (x: Scorer) => !constructorsAssigned.has(x.name)
          );
          if (!constructorToAssign) throw Error();
          currentRacePoints.delete(pointsToAssign);
          constructorToAssign.points += pointsToAssign;
          constructorsAssigned.add(constructorToAssign.name);
        }
      }
    }
  }

  tmpScorerPoints.sort((a: Scorer, b: Scorer) => b.points - a.points);
  let currentIndex = 0;
  for (const tmpConstructor of tmpScorerPoints) {
    currentIndex++;
    if (tmpConstructor.name === scorer.name) {
      scorer.lowestPossible = currentIndex;
      break;
    }
  }
}
