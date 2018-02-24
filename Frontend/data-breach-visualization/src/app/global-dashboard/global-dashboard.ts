import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api-service/api.service";
import {Actor} from "../models/Actor";
import {Incident} from "../models/Incident";
import {Organization} from "../models/Organization";
import {GraphDataService} from "../graph-data-service/graph-data.service";
import {YearRange} from "../dto/YearRange";

@Component({
  selector: 'world-dashboard',
  templateUrl: './global-dashboard.component.html',
  styleUrls: ['./global-dashboard.component.scss']
})
export class GlobalDashboardComponent implements OnInit {
  actorList: Actor [];
  incidentList: Incident [];
  orgList: Organization [];

  yearRange: YearRange;

  yearComparisonData = {};
  actorComparison = {};
  industryComparisonData ={};
  recordsLostComparisonData ={};

  constructor(private apiService:ApiService, private graphDataService: GraphDataService) {}

  ngOnInit() {
    this.apiService.getAllIncidents()
      .subscribe(
        (incidents) => {
          this.incidentList = incidents;
          this.getYearComparisonData();
          this.getRecordsLostComparisonData();
          this.apiService.getAllActors()
            .subscribe(
              (actors) => {
                this.actorList = actors;
                this.getActorPatternComparison();
              }
            );
        }
      );

    this.apiService.getAllOrgs()
      .subscribe(
        (orgs) => {
          this.orgList = orgs;
          this.getIndustryComparisonData();
        }
      );

    this.apiService.getIncidentYearRange()
      .subscribe(
        (range) => {
          this.yearRange = range;
        }
      );
  }

  getYearComparisonData(){
    let labels = [];
    let orgYearData = [];

    for(let year=this.yearRange.minYear; year<=this.yearRange.maxYear; year++){
      labels.push(year.toString());
      let numIncidentsPerYear = 0;
      for(let incident of this.incidentList){
        if(incident.reportYear ==year){
          numIncidentsPerYear+=1;
        }
      }
      orgYearData.push(numIncidentsPerYear)
    }

    this.yearComparisonData = this.graphDataService.getlineChartDataObject('Incidents', labels, orgYearData);
  }

  getRecordsLostComparisonData(){
    let labels = [];
    let recordYearData = [];

    for(let year=this.yearRange.minYear; year<=this.yearRange.maxYear; year++){
      labels.push(year.toString());
      let numRecordsPerYear = 0;
      for(let incident of this.incidentList){
        if(incident.reportYear ==year){
          numRecordsPerYear+=incident.numRecordsLost;
        }
      }
      recordYearData.push(numRecordsPerYear)
    }

    this.recordsLostComparisonData = this.graphDataService.getlineChartDataObject('Records lost', labels, recordYearData);
  }

  getActorPatternComparison() {
    let dataMap = new Map<string, number>();

    for(let incident of this.incidentList) {
      for (let actor of this.actorList) {
        if(incident.actorId == actor.actorId) {
          if (dataMap.get(actor.actorPattern)) {
            dataMap.set(actor.actorPattern, dataMap.get(actor.actorPattern) + 1);
          } else {
            dataMap.set(actor.actorPattern, 1);
          }
          break;
        }
      }
    }
    let typeLabels = [];
    let typeCounts = [];
    dataMap.forEach((value: number, key: string) => {
      if(value>250) {
        typeLabels.push(key);
        typeCounts.push(value);
      }
    });

    this.actorComparison = this.graphDataService.getPieChartDataObject(typeLabels, typeCounts);
  }

  getIndustryComparisonData(){
    let dataMap = new Map<string, number>();

    for (let org of this.orgList) {
      if (dataMap.get(org.orgIndustry)) {
        dataMap.set(org.orgIndustry, dataMap.get(org.orgIndustry) + 1);
      } else {
        dataMap.set(org.orgIndustry, 1);
      }
    }
    let industryLabels = [];
    let industryCounts = [];
    let otherIndustries = 0;
    dataMap.forEach((value: number, key: string) => {
      if(value >300) { //to eliminate low range insustries
        industryLabels.push(key);
        industryCounts.push(value);
      }
    });

    this.industryComparisonData = this.graphDataService.getRadarChartDataObject('Breaches per industry', industryLabels, industryCounts);
  }
}