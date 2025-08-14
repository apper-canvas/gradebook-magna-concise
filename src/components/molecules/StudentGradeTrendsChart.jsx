import React from 'react';
import Chart from 'react-apexcharts';
import { format } from 'date-fns';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';

const StudentGradeTrendsChart = ({ student }) => {
  // Process grade data for chart
  const processGradeData = () => {
    if (!student.grades || student.grades.length === 0) {
      return { series: [], categories: [] };
    }

    // Sort grades by date
    const sortedGrades = [...student.grades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate running average for trend line
    let runningTotal = 0;
    const trendData = sortedGrades.map((grade, index) => {
      const percentage = (grade.score / grade.maxScore) * 100;
      runningTotal += percentage;
      const runningAverage = runningTotal / (index + 1);
      
      return {
        x: new Date(grade.date).getTime(),
        y: parseFloat(percentage.toFixed(1)),
        runningAverage: parseFloat(runningAverage.toFixed(1)),
        assignmentName: grade.assignmentName,
        category: grade.category,
        score: grade.score,
        maxScore: grade.maxScore
      };
    });

    // Create series data
    const series = [
      {
        name: 'Grade Percentage',
        type: 'line',
        data: trendData.map(item => ({
          x: item.x,
          y: item.y,
          assignmentName: item.assignmentName,
          category: item.category,
          score: item.score,
          maxScore: item.maxScore
        }))
      },
      {
        name: 'Running Average',
        type: 'line',
        data: trendData.map(item => ({
          x: item.x,
          y: item.runningAverage
        }))
      }
    ];

    return { series };
  };

  const { series } = processGradeData();

  const chartOptions = {
    chart: {
      type: 'line',
      height: 400,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    colors: ['#3b82f6', '#0ea5e9'],
    stroke: {
      curve: 'smooth',
      width: [3, 2],
      dashArray: [0, 5]
    },
    markers: {
      size: [6, 4],
      colors: ['#3b82f6', '#0ea5e9'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 8
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'MMM dd',
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: true,
        color: '#e2e8f0'
      },
      axisTicks: {
        show: true,
        color: '#e2e8f0'
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        formatter: (value) => `${value}%`,
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      },
      axisBorder: {
        show: true,
        color: '#e2e8f0'
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    tooltip: {
      shared: false,
      intersect: false,
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        const date = new Date(data.x);
        
        if (seriesIndex === 0) {
          // Grade point tooltip
          return `
            <div class="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
              <div class="font-semibold text-gray-900 mb-1">${data.assignmentName}</div>
              <div class="text-sm text-gray-600 mb-2">${data.category}</div>
              <div class="text-sm text-gray-600 mb-1">${format(date, 'MMMM d, yyyy')}</div>
              <div class="font-semibold text-blue-600">Score: ${data.score}/${data.maxScore} (${data.y}%)</div>
            </div>
          `;
        } else {
          // Running average tooltip
          return `
            <div class="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
              <div class="font-semibold text-gray-900 mb-1">Running Average</div>
              <div class="text-sm text-gray-600 mb-1">${format(date, 'MMMM d, yyyy')}</div>
              <div class="font-semibold text-sky-600">${series[seriesIndex][dataPointIndex]}%</div>
            </div>
          `;
        }
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      labels: {
        colors: '#64748b'
      },
      markers: {
        width: 8,
        height: 8,
        radius: 4
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.1,
        gradientToColors: ['#60a5fa', '#38bdf8'],
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.6,
        stops: [0, 100]
      }
    }
  };

  if (!student.grades || student.grades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grade Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">📊</div>
            <p className="text-gray-500 font-medium">No grade data available</p>
            <p className="text-sm text-gray-400">Add some grades to see the trend chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Trends Over Time</CardTitle>
        <p className="text-sm text-gray-600">
          Track {student.firstName}'s performance with individual grades and running average
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <Chart
            options={chartOptions}
            series={series}
            type="line"
            height={400}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">
              {student.grades.length}
            </div>
            <div className="text-sm text-blue-600 font-medium">Total Assignments</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-700">
              {student.gradeAverage.toFixed(1)}%
            </div>
            <div className="text-sm text-green-600 font-medium">Current Average</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">
              {(() => {
                if (student.grades.length < 2) return 'N/A';
                const recent = student.grades.slice(-3);
                const older = student.grades.slice(-6, -3);
                if (older.length === 0) return 'N/A';
                
                const recentAvg = recent.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / recent.length;
                const olderAvg = older.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / older.length;
                const trend = recentAvg - olderAvg;
                
                return trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`;
              })()}
            </div>
            <div className="text-sm text-purple-600 font-medium">Recent Trend</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentGradeTrendsChart;