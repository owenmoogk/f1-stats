import { useState, useEffect } from 'react';

import { useGetConstructorList } from './api';
import { interpolateColor } from './display';
import type { Constructor } from './types';
import type { PointsData } from './util';
import { calculateWinningAbility } from './util';

export default function Constructors(props: { pointsData: PointsData }) {
  const tmpConstructorList = useGetConstructorList();
  const [constructorList, setConstructorList] = useState<Constructor[]>([]);

  useEffect(() => {
    if (!tmpConstructorList.length) return;
    const pointsData = props.pointsData;
    const racesLeft = pointsData.racesLeft;
    const sprintsLeft = pointsData.sprintsLeft;
    const pointsRemaining = pointsData.constructorPoints;
    const pointsRemainingForSecond = pointsData.constructorPointsForSecond;

    const result = calculateWinningAbility(
      tmpConstructorList,
      pointsRemaining,
      pointsRemainingForSecond,
      racesLeft,
      sprintsLeft
    );
    setConstructorList(result);
  }, [props, tmpConstructorList]);

  return (
    <table>
      <tbody>
        <tr>
          <th>Position</th>
          <th>Name</th>
          <th>Points</th>
          <th>Can Win</th>
          <th
            className="hoverTooltip"
            title="If a constructor scores the most points possible, does it guarantee them the championship?"
          >
            Winnable on Performance
          </th>
          <th>Highest Possible Position</th>
          <th>Lowest Possible Position</th>
        </tr>
        {constructorList.map((constructor, index) => {
          const highestPossibleColor = interpolateColor(
            constructor.highestPossible,
            constructorList.length
          );
          const lowestPossibleColor = interpolateColor(
            constructor.lowestPossible,
            constructorList.length
          );
          const lockedIn =
            constructor.highestPossible === constructor.lowestPossible;
          return (
            <tr key={index}>
              <td
                style={{
                  backgroundColor: lockedIn ? 'lightgrey' : '',
                  cursor: lockedIn ? 'help' : '',
                }}
                title={
                  lockedIn
                    ? 'Locked In: This constructors finishing position is already determined.'
                    : ''
                }
              >
                {index + 1}
              </td>
              <td>{constructor.name}</td>
              <td>{constructor.points}</td>
              <td
                className={constructor.highestPossible === 1 ? 'green' : 'red'}
              >
                {constructor.highestPossible === 1 ? 'Yes' : 'No'}
              </td>
              <td className={constructor.canWinByThemselves ? 'green' : 'red'}>
                {constructor.canWinByThemselves ? 'Yes' : 'No'}
              </td>
              <td style={{ backgroundColor: highestPossibleColor }}>
                P{constructor.highestPossible}
              </td>
              <td style={{ backgroundColor: lowestPossibleColor }}>
                P{constructor.lowestPossible}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
