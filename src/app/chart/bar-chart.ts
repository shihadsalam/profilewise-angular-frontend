import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../service/user.service';
import { BarDataSet } from './bar-chart-data';
import { User } from '../user/user';

declare var jsPDF: any;
@Component({
  templateUrl: './bar-chart.html'
})
export class BarChartComponent implements OnInit{

  reportees: String[] = [];
  reportee: string = "";
  fieldType: String = "";
  profileFieldTypes: String[] = [];
  displayChart: boolean = false;
  barChartLabels : String[] = [];
  barChartData: BarDataSet[];
  barChartType = 'bar';
  barChartLegend = true;
  currentUser: User;

  public barChartOptions = {
    scaleShowVerticalLines: false,
    responsive: true,
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true
          }
        }
      ]
    }
  };
  
  //public barChartColors: Array<any> = [
  //  { 
  //    backgroundColor: [
  //      'rgba(223, 86, 218, 1)'
  //    ]
  //  }
  // ]
  

  constructor(private userService: UserService, private router: Router, 
    private route: ActivatedRoute, private snackBar: MatSnackBar) { 
      this.currentUser = userService.getCurrentUser();
      if(this.currentUser.isSupervisor) {
        route.params.subscribe(params => {
          this.userService.getReportees()
            .subscribe(data => {
              data.forEach(each => {
                  this.reportees.push(each.username);
              });
            });
        });
      }
      else {
        this.populateFieldSet(this.currentUser.username);
      }
  }

  populateFieldSet(reportee) {
    this.reportee = reportee;
    this.userService.getProfileFieldsAsMap(reportee)
          .subscribe(data => {
              this.profileFieldTypes = Object.keys(data);
          }); 
  }

  fieldSetSelected(fieldSet) {
    this.fieldType = fieldSet;
}
  
  populateChart() {
    if(!this.reportee) {
      this.openSnackBar("Please select the Reportee", "Error! ");
    }
    else if(!this.fieldType) {
      this.openSnackBar("Please select the Field Set", "Error! ");
    }
    else {
      this.userService.getBarChart(this.reportee, this.fieldType)
        .subscribe(data => {
            if(data) {
              this.barChartLabels = data.labels;
              this.barChartData = data.dataSets;
              this.displayChart = true;
            }
            else {
              this.openSnackBar("Valid chart data parameters unavailable", "Error! ");
            }
        });
    }
  }

  exportAsPDF() {
    var chart = <HTMLCanvasElement>document.getElementById("barChart");
    var dataUrl = chart.toDataURL();
    var title = "Bar Chart Representation - " + this.reportee.toUpperCase() + " | " + this.fieldType;
    var pdf;

    if(chart.width > chart.height){
      pdf = new jsPDF('l', 'mm', [chart.width, chart.height]);
      pdf.text(10, 10, title);
      pdf.addImage(dataUrl, 'JPEG', 30, 30);
      }
      else{
        pdf = new jsPDF('p', 'mm', [chart.height, chart.width]);
        pdf.text(10, 10, title);
        pdf.addImage(dataUrl, 'JPEG', 30, 30);
      }
      pdf.save("barchart_" + this.reportee + ".pdf");
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 2000,
      verticalPosition: 'top'
    });
  }

  ngOnInit() {
  }

}