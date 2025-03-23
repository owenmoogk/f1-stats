import { useState, useEffect } from 'react';

import { useGetDriverList } from './api';
import { interpolateColor } from './display';
import type { Driver } from './types';
import type { PointsData } from './util';
import { calculateWinningAbility } from './util';

export default function Drivers(props: { pointsData: PointsData }) {
  const tmpDriverList = useGetDriverList();
  const [driverList, setDriverList] = useState<Driver[]>([]);

  useEffect(() => {
    if (!tmpDriverList.length) return;
    const pointsData = props.pointsData;
    const racesLeft = pointsData.racesLeft;
    const sprintsLeft = pointsData.sprintsLeft;
    const pointsRemaining = pointsData.driverPoints;
    const pointsRemainingForSecond = pointsData.driverPointsForSecond;

    const result = calculateWinningAbility(
      tmpDriverList,
      pointsRemaining,
      pointsRemainingForSecond,
      racesLeft,
      sprintsLeft
    );
    setDriverList(result);
  }, [props, tmpDriverList]);

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
            title="If a driver scores the most points possible, does it guarantee them the championship?"
          >
            Winnable on Performance
          </th>
          <th>Highest Possible Position</th>
          <th>Lowest Possible Position</th>
        </tr>
        {driverList.map((driver, index) => {
          const highestPossibleColor = interpolateColor(
            driver.highestPossible,
            driverList.length
          );
          const lowestPossibleColor = interpolateColor(
            driver.lowestPossible,
            driverList.length
          );
          const lockedIn = driver.highestPossible === driver.lowestPossible;
          return (
            <tr key={index}>
              <td
                style={{
                  backgroundColor: lockedIn ? 'lightgrey' : '',
                  cursor: lockedIn ? 'help' : '',
                }}
                title={
                  lockedIn
                    ? 'Locked In: This drivers finishing position is already determined.'
                    : ''
                }
              >
                {index + 1}
              </td>
              <td>{driver.name}</td>
              <td>{driver.points}</td>
              <td className={driver.highestPossible === 1 ? 'green' : 'red'}>
                {driver.highestPossible === 1 ? 'Yes' : 'No'}
              </td>
              <td className={driver.canWinByThemselves ? 'green' : 'red'}>
                {driver.canWinByThemselves ? 'Yes' : 'No'}
              </td>
              <td style={{ backgroundColor: highestPossibleColor }}>
                P{driver.highestPossible}
              </td>
              <td style={{ backgroundColor: lowestPossibleColor }}>
                P{driver.lowestPossible}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
