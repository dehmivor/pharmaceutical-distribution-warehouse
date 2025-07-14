'use client'
import React, { useState } from 'react'

function CreateBillWithExistId({ billData, billType, onClose }) {
 const [formData, setFormData] = useState({
     supplierOrCustomer: billData.supplier || billData.customer || '',
     item: billData.item || '',
     amount: billData.amount || 0,
     dueDate: billData.dueDate || '',
     description: billData.description || '',
   });
 
   const handleChange = (e) => {
     const { name, value } = e.target;
     setFormData(prev => ({ ...prev, [name]: value }));
   };
 
   const handleSubmit = (e) => {
     e.preventDefault();
     // TODO: Gửi dữ liệu form lên server hoặc xử lý tạo phiếu thu/chi
     alert(`Tạo phiếu ${billType === 'chi' ? 'chi' : 'thu'} thành công!\n` + JSON.stringify(formData, null, 2));
     onClose();
   };
 
   return (
     <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8, maxWidth: 500, margin: '20px auto', backgroundColor: '#fafafa' }}>
       <h2>Tạo phiếu {billType === 'chi' ? 'chi' : 'thu'}</h2>
       <form onSubmit={handleSubmit}>
         <div style={{ marginBottom: 12 }}>
           <label>{billType === 'chi' ? 'Nhà cung cấp' : 'Khách hàng'}:</label><br />
           <input
             type="text"
             name="supplierOrCustomer"
             value={formData.supplierOrCustomer}
             onChange={handleChange}
             required
             style={{ width: '100%', padding: 6 }}
           />
         </div>
 
         <div style={{ marginBottom: 12 }}>
           <label>Mặt hàng:</label><br />
           <input
             type="text"
             name="item"
             value={formData.item}
             onChange={handleChange}
             required
             style={{ width: '100%', padding: 6 }}
           />
         </div>
 
         <div style={{ marginBottom: 12 }}>
           <label>Số tiền (VNĐ):</label><br />
           <input
             type="number"
             name="amount"
             value={formData.amount}
             onChange={handleChange}
             required
             min={0}
             style={{ width: '100%', padding: 6 }}
           />
         </div>
 
         <div style={{ marginBottom: 12 }}>
           <label>Ngày đến hạn:</label><br />
           <input
             type="date"
             name="dueDate"
             value={formData.dueDate}
             onChange={handleChange}
             required
             style={{ width: '100%', padding: 6 }}
           />
         </div>
 
         <div style={{ marginBottom: 12 }}>
           <label>Mô tả:</label><br />
           <textarea
             name="description"
             value={formData.description}
             onChange={handleChange}
             rows={3}
             style={{ width: '100%', padding: 6 }}
           />
         </div>
 
         <button type="submit" style={{ padding: '8px 16px', marginRight: 10 }}>Lưu</button>
         <button type="button" onClick={onClose} style={{ padding: '8px 16px' }}>Hủy</button>
       </form>
     </div>)
}

export default CreateBillWithExistId
