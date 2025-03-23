import { useEffect, useState } from 'react';

import { Constructor, Driver } from './types';

const baseURL = 'https://api.jolpi.ca/ergast/f1';

export async function getDriverList() {
  const response = await fetch(`${baseURL}/current/driverStandings/`);
  const data = (
    (await response.json()) as {
      MRData: {
        StandingsTable: {
          StandingsLists: {
            DriverStandings: {
              Driver: { givenName: string; familyName: string };
              points: string | undefined;
            }[];
          }[];
        };
      };
    }
  ).MRData.StandingsTable.StandingsLists[0].DriverStandings;
  const drivers = data.map(
    (driver) =>
      new Driver(
        driver.Driver.givenName + ' ' + driver.Driver.familyName,
        parseInt(driver.points ?? '0', 10)
      )
  );
  return drivers;
}

export const useGetDriverList = () => {
  const [driverList, setDriverList] = useState<Driver[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      setDriverList(await getDriverList());
    };
    void fetchData();
  }, []);
  return driverList;
};

export async function getConstructorList() {
  const response = await fetch(`${baseURL}/current/constructorStandings/`);
  const data = (
    (await response.json()) as {
      MRData: {
        StandingsTable: {
          StandingsLists: {
            ConstructorStandings: {
              Constructor: { name: string };
              points: string | undefined;
            }[];
          }[];
        };
      };
    }
  ).MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
  const constructors = data.map(
    (constructor) =>
      new Constructor(
        constructor.Constructor.name,
        parseInt(constructor.points ?? '0', 10)
      )
  );
  return constructors;
}

export const useGetConstructorList = () => {
  const [constructorList, setConstructorList] = useState<Constructor[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      setConstructorList(await getConstructorList());
    };
    void fetchData();
  }, []);
  return constructorList;
};

export async function getMostRecentRoundNumber() {
  const response = await fetch(`${baseURL}/current/driverStandings/`);
  const data = parseInt(
    (
      (await response.json()) as {
        MRData: { StandingsTable: { round: string } };
      }
    ).MRData.StandingsTable.round,
    10
  );
  return data;
}

export const useGetMostRecentRoundNumber = () => {
  const [mostRecentRoundNumber, setMostRecentRoundNumber] = useState<number>();
  useEffect(() => {
    const fetchData = async () => {
      setMostRecentRoundNumber(await getMostRecentRoundNumber());
    };
    void fetchData();
  }, []);
  return mostRecentRoundNumber;
};

export type Race = {
  round: number;
  name: string;
  Sprint: object | undefined;
  raceName: string;
};

export async function getSchedule() {
  const response = await fetch(`${baseURL}/current/`);
  const data = (
    (await response.json()) as { MRData: { RaceTable: { Races: Race[] } } }
  ).MRData.RaceTable.Races;
  return data;
}

export const useGetSchedule = () => {
  const [schedule, setSchedule] = useState<Race[]>();
  useEffect(() => {
    const fetchData = async () => {
      setSchedule(await getSchedule());
    };
    void fetchData();
  }, []);
  return schedule;
};
