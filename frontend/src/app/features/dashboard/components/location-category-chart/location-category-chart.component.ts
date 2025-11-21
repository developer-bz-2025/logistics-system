import { Component, OnInit, ViewChild } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexPlotOptions, ApexYAxis, ApexLegend, ApexGrid, ApexXAxis, ChartComponent } from 'ng-apexcharts';
import { AssetService } from '../../../../core/services/asset.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  grid: ApexGrid;
  colors: string[];
  legend: ApexLegend;
};

@Component({
  selector: 'app-location-category-chart',
  templateUrl: './location-category-chart.component.html',
  styleUrls: ['./location-category-chart.component.scss']
})
export class LocationCategoryChartComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  isLoading = false;

  constructor(private assetService: AssetService) {
    this.chartOptions = {
      series: [],
      chart: {
        type: "bar",
        height: 350,
        stacked: false,
        toolbar: {
          show: true
        },
        zoom: {
          enabled: true
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "80%",
          barHeight: "80%"
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: [],
        type: "category"
      },
      yaxis: {
        title: {
          text: "Number of Assets"
        }
      },
      legend: {
        position: "right",
        offsetY: 40
      },
      grid: {
        show: true
      },
      colors: [
        "#FF5733", // Furniture - Red
        "#33FF57", // Appliances - Green
        "#3357FF", // Machines - Blue
        "#FF33F5", // Vehicles - Pink
        "#F5FF33", // Electronics - Yellow
        "#33FFF5"  // IT Equipment - Cyan
      ]
    };
  }

  ngOnInit(): void {
    this.loadChartData();
  }

  private loadChartData(): void {
    this.isLoading = true;

    this.assetService.getDashboardStats().subscribe({
      next: (response) => {
        this.updateChart(response);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.isLoading = false;
        // Fallback to mock data on error
        this.loadMockData();
      }
    });
  }

  private loadMockData(): void {
    // Mock data for demonstration - matches backend format
    const mockData = {
      "Akkar": {
        "appliances": 30,
        "Furniture": 119,
        "IT Equipment": 11,
        "Machine": 1
      },
      "Bekaa": {
        "Computer": 1
      },
      "HQ": {
        "Furniture": 1
      },
      "Nabaa": {
        "Electronics": 1
      },
      "Tripoli": {
        "Furniture": 1
      }
    };

    this.updateChart({ data: mockData });
  }

  private updateChart(data: any): void {
    // Transform data for ApexCharts grouped bar chart format
    // Backend returns: { data: { location: { category: count } } }
    const locationData = data.data || data;

    const locations = Object.keys(locationData);
    const categorySet = new Set<string>();

    // Collect all unique categories
    locations.forEach(location => {
      Object.keys(locationData[location]).forEach(category => {
        categorySet.add(category);
      });
    });

    const categories: string[] = Array.from(categorySet);

    const series: ApexAxisChartSeries = categories.map(categoryName => ({
      name: categoryName,
      data: locations.map(location => {
        return locationData[location][categoryName] || 0;
      })
    }));

    this.chartOptions = {
      ...this.chartOptions,
      series: series,
      xaxis: {
        categories: locations
      }
    };
  }
}
