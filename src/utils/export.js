import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const exportDataToExcel = (dataList, sheetName, fileName) => {
  try {
    if (!dataList || dataList.length === 0) {
      toast.error('No data available to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`${fileName} Exported Successfully!`);
  } catch (error) {
    console.error("Export Error:", error);
    toast.error('Failed to export data.');
  }
};
