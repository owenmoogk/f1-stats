import { useEffect, useState } from "react";
import { Constructor, Driver } from "./types";

const baseURL = "https://api.jolpi.ca/ergast/f1"

export async function getDriverList() {
	var response = await fetch(`${baseURL}/current/driverStandings/`)
	var data = (await response.json()).MRData.StandingsTable.StandingsLists[0].DriverStandings as unknown
	var drivers = (data as any).map((driver: any) => new Driver(driver.Driver.givenName + " " + driver.Driver.familyName, parseInt(driver.points ?? "0")))
	console.log(drivers)
	return (drivers);
}

export const useGetDriverList = () => {
	const [driverList, setDriverList] = useState<Driver[]>([]);
	useEffect(() => {
		const fetchData = async () => {
			setDriverList(await getDriverList());
		}
		fetchData();
	}, []);
	return driverList;
}

export async function getConstructorList() {
	var response = await fetch(`${baseURL}/current/constructorStandings/`)
	var data = (await response.json()).MRData.StandingsTable.StandingsLists[0].ConstructorStandings as unknown
	var constructors = (data as any).map((constructor: any) => new Constructor(constructor.Constructor.name, parseInt(constructor.points ?? "0")))
	console.log(constructors)
	return (constructors);
}

export const useGetConstructorList = () => {
	const [constructorList, setConstructorList] = useState<Constructor[]>([]);
	useEffect(() => {
		const fetchData = async () => {
			setConstructorList(await getConstructorList());
		}
		fetchData();
	}, []);
	return constructorList;
}

export async function getMostRecentRoundNumber() {
	var response = await fetch(`${baseURL}/current/driverStandings/`)
	var data = parseInt((await response.json()).MRData.StandingsTable.round)
	return data
}

export const useGetMostRecentRoundNumber = () => {
	const [mostRecentRoundNumber, setMostRecentRoundNumber] = useState<number>();
	useEffect(() => {
		const fetchData = async () => {
			setMostRecentRoundNumber(await getMostRecentRoundNumber());
		}
		fetchData();
	}, []);
	return mostRecentRoundNumber;
}

export type Race = {
	round: number,
	name: string,
	Sprint: object,
	raceName: string
}

export async function getSchedule() {
	var response = await fetch(`${baseURL}/current/`)
	var data = (await response.json()).MRData.RaceTable.Races as Race[]
	console.log(data)
	return data
}

export const useGetSchedule = () => {
	const [schedule, setSchedule] = useState<Race[]>();
	useEffect(() => {
		const fetchData = async () => {
			setSchedule(await getSchedule());
		}
		fetchData();
	}, []);
	return schedule;
}
