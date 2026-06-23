import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoute.js';
import userRoutes from './routes/userRoute.js';
import pageRoutes from './routes/pageRoute.js';
import userPageRoutes from './routes/userPageRoute.js';
import mapsRoutes from './routes/mapsRoute.js';
import salesRoutes from './routes/salesRoute.js';
import purchaseRoutes from './routes/purchaseRoute.js';
import partnerRoutes from './routes/partnerRoute.js';
import vendorRoutes from './routes/vendorRoutes.js';
import accountMoveRoutes from './routes/accountMoveRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import vendorPaymentRoutes from './routes/vendorPaymentRoutes.js';
import journalEntryRoutes from './routes/journalEntryRoutes.js';
import journalItemRoutes from './routes/JournalItemRoutes.js';
import moveHistoryRoutes from './routes/moveHistoryRoutes.js';
import moduleRoutes from './routes/moduleRoute.js';
import salesOrderRoutes from './routes/saleOrderRoute.js';
import analyticItemRoutes from './routes/analyticItemRoutes.js';
import purchaseOutstandingRoutes from './routes/purchaseOutstandingRoutes.js';
import courierPriceRoutes from './routes/courierPriceRoute.js';
import customerRoutes from './routes/customerRoute.js';
import dcRoutes from './routes/dcRoute.js';
import orderDashboardRoutes from './routes/orderDashboardRoute.js';
import soSummaryRoutes from './routes/soSummaryRoute.js';
import salesDashboardRoutes from './routes/salesDashboardRoute.js';
import sellOutCustomersRoutes from './routes/sellOutCustomersRoute.js';
import inventoryBalanceRoutes from './routes/inventoryBalanceRoute.js';
import insuranceReportRoutes from './routes/insuranceReportRoute.js';
import outstandingGrRoutes from './routes/outstandingGrRoute.js';
import outstandingDispatchRoutes from './routes/outstandingDispatchRoute.js';
import outstandingDispatchFreightRoutes from './routes/outstandingDispatchFreightRoute.js';
import outstandingPiRoutes from './routes/outstandingPiRoute.js';
import outstandingDoRoutes from './routes/outstandingDoRoute.js';
import outstandingDoCostRoutes from './routes/outstandingDoCostRoute.js';
import outstandingCancelDocRoutes from './routes/outstandingCancelDocRoute.js';
import outstandingPodCostRoutes from './routes/outstandingPodCostRoute.js';
import outstandingDrRoutes from './routes/outstandingDrRoute.js';
import outstandingPrRoutes from './routes/outstandingPrRoute.js';
import outstandingTtfRoutes from './routes/outstandingTtfRoute.js';
import outstandingSiQtyRoutes from './routes/outstandingSiQtyRoute.js';
import mtiStatutorySalesRoutes from './routes/mtiStatutorySalesRoute.js';
import podHandOverRoutes from './routes/podHandOverRoute.js';
import pkg from 'pg';
import { WebSocketServer } from 'ws';
import multer from 'multer';
import vision from '@google-cloud/vision';
import fs from 'fs';
import { startUserIcon } from './jobs/userCron.js';

dotenv.config();
const app = express();
// startUserIcon();
const upload=multer({dest:'uploads/'});
const client_google_vision=new vision.ImageAnnotatorClient({
    keyFilename:'./ocr-test.json'
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/product', productRoutes);
app.use('/sales', salesRoutes);
app.use('/purchase', purchaseRoutes);
app.use('/partner',partnerRoutes);
app.use('/vendor',vendorRoutes);
app.use('/account_moves',accountMoveRoutes);
app.use('/invoices',invoiceRoutes);
app.use('/payment',paymentRoutes);
app.use('/vendor_payment',vendorPaymentRoutes);
app.use('/journal_entry',journalEntryRoutes);
app.use('/journal_item',journalItemRoutes);
app.use('/move_history',moveHistoryRoutes);
app.use('/sale_order',salesOrderRoutes);
app.use('/analytic_item',analyticItemRoutes);
app.use('/purchase_outstanding',purchaseOutstandingRoutes);
app.use('/user', userRoutes);
app.use('/page', pageRoutes);
app.use('/user_page', userPageRoutes);
app.use('/maps', mapsRoutes);
app.use('/module', moduleRoutes);
app.use('/courier_price', courierPriceRoutes);
app.use('/customer', customerRoutes);
app.use('/dc', dcRoutes);
app.use('/order_dashboard', orderDashboardRoutes);
app.use('/so_summary', soSummaryRoutes);
app.use('/sales_dashboard', salesDashboardRoutes);
app.use('/sell_out_customer', sellOutCustomersRoutes);
app.use('/inventory_balance', inventoryBalanceRoutes);
app.use('/insurance_report', insuranceReportRoutes);
app.use('/outstanding_gr', outstandingGrRoutes);
app.use('/outstanding_dispatch', outstandingDispatchRoutes);
app.use('/outstanding_dispatch_freight', outstandingDispatchFreightRoutes);
app.use('/outstanding_pi', outstandingPiRoutes);
app.use('/outstanding_do', outstandingDoRoutes);
app.use('/outstanding_do_cost', outstandingDoCostRoutes);
app.use('/outstanding_cancel_doc', outstandingCancelDocRoutes);
app.use('/outstanding_pod_cost', outstandingPodCostRoutes);
app.use('/outstanding_dr', outstandingDrRoutes);
app.use('/outstanding_pr', outstandingPrRoutes);
app.use('/outstanding_ttf', outstandingTtfRoutes);
app.use('/outstanding_si_qty', outstandingSiQtyRoutes);
app.use('/mti_statutory_sales', mtiStatutorySalesRoutes);
app.use('/pod_hand_over', podHandOverRoutes);
app.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    const [result] = await client_google_vision.textDetection(req.file.path);
    fs.unlinkSync(req.file.path); // hapus file

    res.json({
      text: result.fullTextAnnotation.text
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const client = new pkg.Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_2,
    port: process.env.DB_PORT,
});
await client.connect();
await client.query('LISTEN user_page_updated');
await client.query('LISTEN maps_changed');

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
});

client.on("notification", (msg) => {
    console.log("Database updated:", msg.channel, msg.payload);

    wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: msg.channel,
                id_user: msg.payload
            }));
        }
    });
});