import { Component, OnInit, ViewChild } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexPlotOptions, ApexYAxis, ApexLegend, ApexGrid, ApexXAxis, ChartComponent } from 'ng-apexcharts';
import { AssetService } from '../../../../core/services/category.service';

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
        stacked: true,
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
          columnWidth: "55%",
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

    // For now, we'll use mock data. In a real implementation, you'd call an API endpoint
    // that returns aggregated data by location and category
    // TODO: Implement API call to getAssetsByLocationAndCategory()
    setTimeout(() => {
      this.loadMockData();
      this.isLoading = false;
    }, 500); // Simulate API delay
  }

  private loadMockData(): void {
    // Mock data for demonstration
    const mockData = {
      locations: ['HQ', 'Bekaa', 'Branch 1', 'Warehouse A'],
      categories: ['Furniture', 'Appliances', 'Electronics', 'IT Equipment'],
      data: [
        { location: 'HQ', category: 'Furniture', count: 45 },
        { location: 'HQ', category: 'Appliances', count: 23 },
        { location: 'HQ', category: 'Electronics', count: 12 },
        { location: 'HQ', category: 'IT Equipment', count: 34 },
        { location: 'Bekaa', category: 'Furniture', count: 28 },
        { location: 'Bekaa', category: 'Appliances', count: 15 },
        { location: 'Bekaa', category: 'Electronics', count: 8 },
        { location: 'Bekaa', category: 'IT Equipment', count: 22 },
        { location: 'Branch 1', category: 'Furniture', count: 18 },
        { location: 'Branch 1', category: 'Appliances', count: 9 },
        { location: 'Branch 1', category: 'Electronics', count: 6 },
        { location: 'Branch 1', category: 'IT Equipment', count: 14 },
        { location: 'Warehouse A', category: 'Furniture', count: 32 },
        { location: 'Warehouse A', category: 'Appliances', count: 19 },
        { location: 'Warehouse A', category: 'Electronics', count: 11 },
        { location: 'Warehouse A', category: 'IT Equipment', count: 27 }
      ]
    };

    this.updateChart(mockData);
  }

  private updateChart(data: any): void {
    // Transform data for ApexCharts stacked bar format
    const locationSet = new Set<string>();
    const categorySet = new Set<string>();

    data.data.forEach((item: any) => {
      locationSet.add(item.location);
      categorySet.add(item.category);
    });

    const categories: string[] = Array.from(locationSet);
    const seriesNames: string[] = Array.from(categorySet);

    const series: ApexAxisChartSeries = seriesNames.map(categoryName => ({
      name: categoryName,
      data: categories.map(location => {
        const item = data.data.find((d: any) => d.location === location && d.category === categoryName);
        return item ? item.count : 0;
      })
    }));

    this.chartOptions = {
      ...this.chartOptions,
      series: series,
      xaxis: {
        categories: categories
      }
    };
  }
}
