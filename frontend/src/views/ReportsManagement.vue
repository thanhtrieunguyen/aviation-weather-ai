<template>
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Phân tích & báo cáo</h1>
        <div class="flex space-x-4">
            <select class="border rounded px-3 py-2" aria-label="Chọn khoảng thời gian">
                <option value="">Chọn khoảng thời gian</option>
                <option value="7_days">7 ngày qua</option>
                <option value="30_days">30 ngày qua</option>
                <option value="this_month">Tháng này</option>
                <option value="last_month">Tháng trước</option>
                <option value="custom">Tùy chỉnh</option>
            </select>
          <button @click="exportToPdf" class="bg-red-500 text-white px-4 py-2 rounded">Xuất PDF</button>
          <button @click="exportToExcel" class="bg-green-500 text-white px-4 py-2 rounded">Xuất Excel</button>
        </div>
      </div>
  
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white p-4 rounded shadow-sm text-center">
          <h2 class="text-lg font-semibold">Tổng Chuyến bay</h2>
          <p class="text-4xl font-bold">3,600</p>
          <p class="text-green-500">↑ 5%</p>
        </div>
        <div class="bg-white p-4 rounded shadow-sm text-center">
          <h2 class="text-lg font-semibold">Tỷ lệ Đặt vé</h2>
          <p class="text-4xl font-bold">78%</p>
          <p class="text-green-500">↑ 10%</p>
        </div>
        <div class="bg-white p-4 rounded shadow-sm text-center">
          <h2 class="text-lg font-semibold">Doanh thu</h2>
          <p class="text-4xl font-bold">5.2T đ</p>
          <p class="text-green-500">↑ 15%</p>
        </div>
        <div class="bg-white p-4 rounded shadow-sm text-center">
          <h2 class="text-lg font-semibold">Khách hàng Mới</h2>
          <p class="text-4xl font-bold">1,240</p>
          <p class="text-green-500">↑ 8%</p>
        </div>
      </div>
  
      <div id="charts-container" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-4 rounded shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Xu hướng Chuyến bay</h2>
          <div class="chart-container">
            <canvas ref="flightTrendChart"></canvas>
          </div>
        </div>
        <div class="bg-white p-4 rounded shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Phân bố Đặt vé</h2>
          <div class="chart-container">
            <canvas ref="bookingDistributionChart"></canvas>
          </div>
        </div>
        <div class="bg-white p-4 rounded shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Doanh thu theo thời gian</h2>
          <div class="chart-container">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Chi tiết Phân tích Section -->
      <div class="mt-6">
        <div class="bg-white rounded shadow-sm">
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-4">Chi tiết Phân tích</h2>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chuyến bay</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đặt vé</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ lệ lấp đầy</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="detail in analysisDetails" :key="detail.date">
                    <td class="px-6 py-4 whitespace-nowrap">{{ detail.date }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ detail.flights }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ detail.bookings }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ formatCurrency(detail.revenue) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ detail.fillRate }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Add price information to reports -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Thống kê doanh thu</h2>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h3 class="text-lg font-medium text-blue-800">Doanh thu dự kiến</h3>
              <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(revenueStats.expectedRevenue) }}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <h3 class="text-lg font-medium text-green-800">Doanh thu thực tế</h3>
              <p class="text-2xl font-bold text-green-600">{{ formatCurrency(revenueStats.actualRevenue) }}</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
              <h3 class="text-lg font-medium text-purple-800">Tiết kiệm qua khuyến mãi</h3>
              <p class="text-2xl font-bold text-purple-600">{{ formatCurrency(revenueStats.discountAmount) }}</p>
            </div>
          </div>
          <div class="mt-6">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import Chart from 'chart.js/auto';
  import jsPDF from 'jspdf';
  import html2canvas from 'html2canvas';
  import * as XLSX from 'xlsx';
  
  const flightTrendChart = ref(null);
  const bookingDistributionChart = ref(null);
  const revenueChart = ref(null);
  const analysisDetails = ref([
    {
      date: '20/12/2024',
      flights: 35,
      bookings: 621,
      revenue: 151950698,
      fillRate: 99
    },
    {
      date: '21/12/2024',
      flights: 40,
      bookings: 1383,
      revenue: 375820796,
      fillRate: 87
    },
    {
      date: '22/12/2024',
      flights: 55,
      bookings: 833,
      revenue: 64019754,
      fillRate: 94
    }
  ]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(value);
  };
  // const reportData = {
  //   metrics: [
  //     { label: 'Tổng Chuyến bay', value: 3600, growth: '5%' },
  //     { label: 'Tỷ lệ Đặt vé', value: '78%', growth: '10%' },
  //     { label: 'Doanh thu', value: '5.2T đ', growth: '15%' },
  //     { label: 'Khách hàng Mới', value: 1240, growth: '8%' }
  //   ],
  //   flightTrend: [
  //     { date: '20/12', flights: 200, bookings: 500 },
  //     { date: '21/12', flights: 300, bookings: 800 },
  //     { date: '22/12', flights: 500, bookings: 1100 },
  //     { date: '23/12', flights: 700, bookings: 1500 },
  //     { date: '24/12', flights: 900, bookings: 1410 },
  //     { date: '25/12', flights: 600, bookings: 800 },
  //     { date: '26/12', flights: 400, bookings: 600 }
  //   ],
  //   bookingDistribution: [
  //     { type: 'Phổ thông', percentage: 60 },
  //     { type: 'Thương gia', percentage: 25 },
  //     { type: 'Hạng nhất', percentage: 15 }
  //   ],
  //   revenue: [
  //     { date: '20/12', amount: 150000000 },
  //     { date: '21/12', amount: 280000000 },
  //     { date: '22/12', amount: 160000000 },
  //     { date: '23/12', amount: 200000000 },
  //     { date: '24/12', amount: 320000000 },
  //     { date: '25/12', amount: 280000000 },
  //     { date: '26/12', amount: 320000000 }
  //   ]
  // };
  
  const exportToPdf = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const element = document.querySelector('#charts-container');
      pdf.setFontSize(16);
      pdf.text('Báo cáo Phân tích', 20, 20);
      pdf.setFontSize(12);
      reportData.metrics.forEach((metric, index) => {
        const y = 40 + (index * 10);
        pdf.text(`${metric.label}: ${metric.value} (${metric.growth})`, 20, y);
      });
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 20, 90, 170, 100);
      pdf.save('analytics-report.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Có lỗi khi xuất PDF. Vui lòng thử lại.');
    }
  };
  
  const exportToExcel = () => {
    try {
   
      const wb = XLSX.utils.book_new();
      const metricsWS = XLSX.utils.json_to_sheet(reportData.metrics);
      XLSX.utils.book_append_sheet(wb, metricsWS, 'Metrics');
      const trendWS = XLSX.utils.json_to_sheet(reportData.flightTrend);
      XLSX.utils.book_append_sheet(wb, trendWS, 'Flight Trend');
      const distributionWS = XLSX.utils.json_to_sheet(reportData.bookingDistribution);
      XLSX.utils.book_append_sheet(wb, distributionWS, 'Booking Distribution');
      const revenueWS = XLSX.utils.json_to_sheet(reportData.revenue);
      XLSX.utils.book_append_sheet(wb, revenueWS, 'Revenue');
      const detailsWS = XLSX.utils.json_to_sheet(analysisDetails.value);
      XLSX.utils.book_append_sheet(wb, detailsWS, 'Analysis Details');
      const revenueDataWS = XLSX.utils.json_to_sheet(reportData.value.revenueData);
      XLSX.utils.book_append_sheet(wb, revenueDataWS, 'Revenue Data');
      XLSX.writeFile(wb, 'analytics-report.xlsx');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Có lỗi khi xuất Excel. Vui lòng thử lại.');
    }
  };
  
  onMounted(() => {
    const flightTrendData = {
      labels: ['20/12', '21/12', '22/12', '23/12', '24/12', '25/12', '26/12'],
      datasets: [
        {
          label: 'Số chuyến bay',
          data: [200, 300, 500, 700, 900, 600, 400],
          borderColor: '#4A90E2',
          tension: 0.3,
          fill: false
        },
        {
          label: 'Số lượng đặt vé',
          data: [500, 800, 1100, 1500, 1410, 800, 600],
          borderColor: '#7ED321',
          tension: 0.3,
          fill: false
        }
      ]
    };
    const bookingDistributionData = {
      labels: ['Phổ thông', 'Thương gia', 'Hạng nhất'],
      datasets: [{
        data: [60, 25, 15],
        backgroundColor: ['#F5A623', '#7ED321', '#4A90E2'],
      }]
    };
    const revenueData = {
      labels: ['20/12', '21/12', '22/12', '23/12', '24/12', '25/12', '26/12'],
      datasets: [{
        label: 'Doanh thu',
        data: [150000000, 280000000, 160000000, 200000000, 320000000, 280000000, 320000000],
        backgroundColor: '#9B51E0',
        borderColor: '#9B51E0',
        borderWidth: 1
      }]
    };
  
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: {
              size: 11
            }
          }
        }
      }
    };
  
    new Chart(flightTrendChart.value, {
      type: 'line',
      data: flightTrendData,
      options: {
        ...commonOptions,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 11
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: 11
              }
            }
          }
        }
      }
    });
  
    new Chart(bookingDistributionChart.value, {
      type: 'pie',
      data: bookingDistributionData,
      options: commonOptions
    });

    new Chart(revenueChart.value, {
      type: 'bar',
      data: revenueData,
      options: {
        ...commonOptions,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return (value / 1000000).toFixed(0) + 'M';
              },
              font: {
                size: 11
              }
            }
          }
        }
      }
    });

    // Initialize revenue chart
    const revenueChartData = {
      labels: reportData.value.revenueData.map(item => item.month),
      datasets: [
        {
          label: 'Doanh thu dự kiến',
          data: reportData.value.revenueData.map(item => item.expected),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Doanh thu thực tế',
          data: reportData.value.revenueData.map(item => item.actual),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
  
    new Chart(revenueChart.value, {
      type: 'bar',
      data: revenueChartData,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value).replace('₫', '');
              }
            }
          }
        }
      }
    });
  });
  
  const revenueStats = ref({
    expectedRevenue: 1250000000,
    actualRevenue: 980000000,
    discountAmount: 270000000
  });
  
  const reportData = ref({
    metrics: [
      { label: 'Tổng Chuyến bay', value: 3600, growth: '5%' },
      { label: 'Tỷ lệ Đặt vé', value: '78%', growth: '10%' },
      { label: 'Doanh thu', value: '5.2T đ', growth: '15%' },
      { label: 'Khách hàng Mới', value: 1240, growth: '8%' }
    ],
    flightTrend: [
      { date: '20/12', flights: 200, bookings: 500 },
      { date: '21/12', flights: 300, bookings: 800 },
      { date: '22/12', flights: 500, bookings: 1100 },
      { date: '23/12', flights: 700, bookings: 1500 },
      { date: '24/12', flights: 900, bookings: 1410 },
      { date: '25/12', flights: 600, bookings: 800 },
      { date: '26/12', flights: 400, bookings: 600 }
    ],
    bookingDistribution: [
      { type: 'Phổ thông', percentage: 60 },
      { type: 'Thương gia', percentage: 25 },
      { type: 'Hạng nhất', percentage: 15 }
    ],
    revenue: [
      { date: '20/12', amount: 150000000 },
      { date: '21/12', amount: 280000000 },
      { date: '22/12', amount: 160000000 },
      { date: '23/12', amount: 200000000 },
      { date: '24/12', amount: 320000000 },
      { date: '25/12', amount: 280000000 },
      { date: '26/12', amount: 320000000 }
    ],
    revenueData: [
      { month: 'Tháng 1', expected: 180000000, actual: 165000000 },
      { month: 'Tháng 2', expected: 210000000, actual: 190000000 },
      { month: 'Tháng 3', expected: 250000000, actual: 195000000 },
      { month: 'Tháng 4', expected: 300000000, actual: 240000000 },
      { month: 'Tháng 5', expected: 310000000, actual: 190000000 }
    ]
  });
  </script>
  
  <style scoped>
  .grid-cols-1 {
    display: grid;
    gap: 1.5rem;
  }
  
  @media (min-width: 768px) {
    .md\:grid-cols-4 {
      grid-template-columns: repeat(4, 1fr);
    }
    .md\:grid-cols-2 {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  .chart-container {
    position: relative;
    height: 280px;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
  
  canvas {
    width: 100%;
    height: 100%;
  }

  table {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
  }

  th {
    background-color: #f9fafb;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e5e7eb;
  }

  td {
    vertical-align: middle;
    border-bottom: 1px solid #e5e7eb;
  }

  tbody tr:hover {
    background-color: #f9fafb;
  }

  .whitespace-nowrap {
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    td, th {
      padding: 0.75rem 0.5rem;
    }
  }
  </style>