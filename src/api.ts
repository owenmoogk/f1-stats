import { Driver, Constructor } from "./types";
import $ from 'jquery';

export async function getDriverList() {
	var response = await fetch("https://ergast.com/api/f1/current/driverStandings")
	var text = await response.text()
	var xml = new window.DOMParser().parseFromString(text, "text/xml")
	var tmpDrivers: Driver[] = [];
	$(xml).find("DriverStanding").each((_, driver) => {
		var driverInfo = $(driver).find("Driver")
		var driverElement = $(driver)
		tmpDrivers.push(new Driver(driverInfo.find("GivenName").text() + " " + driverInfo.find("FamilyName").text(), parseInt(driverElement.attr("points") ?? "0")))
	})
	return (tmpDrivers);
}

export async function getConstructorList() {
	var response = await fetch("https://ergast.com/api/f1/current/constructorStandings")
	var text = await response.text();
	var xml = new window.DOMParser().parseFromString(text, "text/xml")
	var tmpConstructors: Constructor[] = [];
	$(xml).find("ConstructorStanding").each((index, element) => {
		tmpConstructors.push(new Constructor($(element).find("Name").text(), parseInt($(element).attr("points") ?? "0")));
	});
	return (tmpConstructors);
}

export async function getMostRecentRound() {
	var response = await fetch("https://ergast.com/api/f1/current/last/results")
	var text = await response.text();
	var xml = new window.DOMParser().parseFromString(text, "text/xml")
	return $(xml).find("Race")
}

export async function getSchedule() {
	var response = await fetch("https://ergast.com/api/f1/current")
	var text = await response.text()
	var xml = new window.DOMParser().parseFromString(text, "text/xml")
	return xml
}