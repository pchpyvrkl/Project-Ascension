import { WEEKDAY_LABELS_EN, WEEKDAY_LABELS_TH } from './config.js';

export let WEEKDAY_LABELS = WEEKDAY_LABELS_EN;

/* ============================================================
   i18n — EN/TH. "Project Ascension" itself is never translated.
   ============================================================ */
export const I18N = {
  en: {
    'nav.today':'Today', 'nav.calendar':'Calendar', 'nav.tasks':'Tasks', 'nav.analytics':'Analytics', 'nav.install':'Install App',
    'credit':'Built by Perth',
    'about.title':'About', 'about.name':'Perth - Pongsakorn Chotpunyavorakul', 'about.role':'Creator & Developer',
    'about.description':'Project Ascension is a personal consistency operating system — a calendar, habit tracker, XP system, and analytics dashboard rolled into one, built to make showing up every day feel like progress you can actually see.',
    'help.title':'How to Use', 'help.subtitle':'Complete guide to every feature',
    'help.gettingstarted':'Getting Started',
    'help.gettingstarted.desc':'<strong>1. Create an Account:</strong> Click "Register" on the login screen, enter a username and password, and click "Create Account". Your data is stored locally in your browser.<br><br><strong>2. Log In:</strong> After registering, use your credentials to log in. You\'ll be taken to the Today view.<br><br><strong>3. Create Your First Task:</strong> Click the "+ New Task" button to add habits, goals, or daily activities you want to track.',
    'help.todayview':'Today View',
    'help.todayview.desc':'<strong>What it does:</strong> Shows all tasks scheduled for today, your XP progress, and completion statistics.<br><br><strong>How to use:</strong><br>• Check the checkbox next to each task to mark it complete<br>• Click the ✎ icon to edit a task<br>• Click the 🗑 icon to delete a task<br>• Drag tasks using the ⋮⋮ handle to reorder them<br>• Click "+ New Task" to add more tasks for today<br><br><strong>XP System:</strong> Each task has an XP reward. When you complete a task, you earn that XP. Your daily XP is shown at the top.<br><br><strong>Statistics:</strong><br>• Today\'s XP: Total XP earned today<br>• Completion: Percentage of today\'s tasks completed<br>• Highest % Complete: Your best daily completion rate<br>• Highest XP: Your most productive day by XP earned',
    'help.creatingtasks':'Creating Tasks',
    'help.creatingtasks.desc':'<strong>Task Properties:</strong><br>• <strong>Name:</strong> What the task is called (e.g., "Morning Workout", "Read 30 minutes")<br>• <strong>XP Reward:</strong> How much XP you earn when completing this task (higher XP = more challenging/important)<br>• <strong>Color:</strong> Visual tag to organize tasks by category<br>• <strong>Category:</strong> Assign a task to a custom category such as Work, Health, or Personal<br><br><strong>Repeat Options:</strong><br>• <strong>Every Day:</strong> Task appears every single day<br>• <strong>Weekdays:</strong> Monday through Friday only<br>• <strong>Weekends:</strong> Saturday and Sunday only<br>• <strong>Specific Weekdays:</strong> Choose exactly which days (e.g., Mon, Wed, Fri)<br>• <strong>Every X Days:</strong> Repeats every N days (e.g., every 3 days)<br>• <strong>Monthly:</strong> Same date each month (e.g., the 15th of every month)<br>• <strong>Only Today:</strong> One-time task that won\'t repeat<br><br><strong>Date Range:</strong> Optionally set start and end dates for when the task should appear.<br><br><strong>Categories:</strong><br>• Open the Categories panel from the day view to create, edit, or delete categories<br>• Give each category a name and color for easy visual grouping<br>• Click an existing category in the list to edit it anytime',
    'help.calendarview':'Calendar View',
    'help.calendarview.desc':'<strong>What it does:</strong> Shows a monthly calendar with color-coded days based on your productivity.<br><br><strong>How to use:</strong><br>• Use ← Prev / Next → buttons to navigate months<br>• Click "Today" to jump to the current month<br>• Click any day to see that day\'s tasks and notes<br>• Days are colored based on XP earned (lighter = less XP, darker = more XP)<br>• Colored dots on each day show which tasks were completed<br><br><strong>Day Details Panel:</strong> When you click a day, you can:<br>• View all tasks for that day<br>• Add new tasks to that specific day<br>• Add personal notes about how that day went<br>• See XP earned and completion percentage',
    'help.analyticsview':'Analytics View',
    'help.analyticsview.desc':'<strong>What it does:</strong> Comprehensive statistics and visualizations of your consistency and productivity over time.<br><br><strong>Key Metrics:</strong><br>• <strong>Tasks Completed (All-Time):</strong> Total number of tasks you\'ve ever completed<br>• <strong>Active Tasks:</strong> Number of currently active/recurring tasks<br>• <strong>Days Tracked:</strong> How many days you\'ve used the app<br>• <strong>Overall Success Rate:</strong> Your average completion rate across all days<br>• <strong>Today\'s Metrics:</strong> Real-time stats for the current day<br>• <strong>Avg Completion (All-Time):</strong> Your historical average completion percentage<br>• <strong>Avg Daily XP:</strong> Your average XP earned per day<br>• <strong>Perfect Days:</strong> Days where you completed 100% of tasks<br>• <strong>Most Productive Day:</strong> The day you earned the most XP<br>• <strong>Consistency Score (20d):</strong> How consistent you\'ve been in the last 20 days<br><br><strong>Visualizations:</strong><br>• <strong>Monthly Heatmap:</strong> Grid showing your productivity over the last year (darker = more productive)<br>• <strong>Current Month Daily % Complete:</strong> Bar chart showing completion rate each day this month<br>• <strong>Current Month Daily XP:</strong> Bar chart showing XP earned each day this month<br>• <strong>XP vs % Complete Scatter Plot:</strong> Shows relationship between XP earned and completion rate',
    'help.deletingtasks':'Deleting Tasks',
    'help.deletingtasks.desc':'<strong>When you delete a recurring task, you have three options:</strong><br><br>• <strong>This event only:</strong> Delete just this one occurrence (future occurrences remain)<br>• <strong>This and following events:</strong> Delete this occurrence and all future ones (keeps past history)<br>• <strong>All events:</strong> Delete every occurrence of this task, including past completions<br><br>This flexibility lets you adjust your routine without losing historical data.',
    'help.account':'Account Management',
    'help.account.desc':'<strong>Settings:</strong> Click the sync status in the sidebar footer to access account settings.<br><br><strong>Log Out:</strong> Signs you out but keeps your data stored locally.<br><br><strong>Delete Account:</strong> Permanently removes all your data (tasks, history, notes). This cannot be undone. You\'ll need to re-enter your password to confirm.<br><br><strong>Data Storage:</strong> All data is stored in your browser\'s localStorage. Clearing your browser data will delete your progress.',
    'help.tips':'Pro Tips',
    'help.tips.desc':'• Start with 3-5 simple daily tasks to build momentum<br>• Use higher XP values for more important or difficult tasks<br>• Create categories for work, health, learning, and personal goals<br>• Use colors to quickly spot category groups in your task list<br>• Edit categories anytime from the Categories panel if your system changes<br>• Check the Analytics view weekly to track your consistency<br>• Use the Calendar to plan ahead and review past performance<br>• Add notes to days to remember what worked or what didn\'t<br>• Aim for consistency over perfection — missing one day is okay<br>• The Success Rate in the sidebar shows your recent performance',
    'gate.subtitle':'Sign in to continue', 'gate.login':'Log In', 'gate.register':'Register',
    'gate.username':'Username', 'gate.password':'Password',
    'gate.creating':'Creating account…', 'gate.signing':'Signing in…',
    'gate.enterboth':'Enter your username and password.', 'gate.checking':'Checking session…',
    'gate.expired':'Session expired — please log in again.', 'gate.createbtn':'Create Account',
    'today.title':'Today', 'today.newtask':'+ New Task', 'today.categories':'+ Categories', 'today.xp':"Today's XP",
    'today.completion':'Completion', 'today.bestpct':'Highest % Complete', 'today.bestxp':'Highest XP',
    'today.uncategorized':'Uncategorized',
    'today.empty':'No tasks scheduled for today. Add one to get started.',
    'calendar.title':'Calendar', 'calendar.sub':'Click a day for details',
    'calendar.prev':'← Prev', 'calendar.next':'Next →', 'calendar.today':'Today',
    'analytics.title':'Analytics', 'analytics.sub':'Your consistency, quantified',
    'analytics.overallsuccess':'Overall Success Rate', 'analytics.todaystasks':"Today's Tasks", 'analytics.todaycompleted':"Today's Completed", 'analytics.todayrate':"Today's Success Rate",
    'analytics.avgpct':'Most Productive Month', 'analytics.avgxp':'Avg Daily XP (All-Time)',
    'analytics.bestday':'Most Productive Day',
    'analytics.monthlyheatmap':'Monthly Heatmap', 'analytics.currentmonth':'% Complete Chart',
    'analytics.currentmonthxp':'XP Chart',
    'analytics.scatterplot':'XP vs % Complete Scatter Plot',
    'analytics.consistency':'Consistency Score (20d)', 'analytics.perfectdays':'Perfect Days',
    'analytics.totalcompleted':'Tasks Completed (All-Time)', 'analytics.activetasks':'Active Tasks', 'analytics.daystracked':'Days Tracked',
    'analytics.yearTotal':'Year Total', 'analytics.yearAvg':'avg',
    'period.days':'Days', 'period.thismonth':'This Month', 'period.months':'Months', 'period.years':'Years',
    'taskform.newtitle':'New Task', 'taskform.edittitle':'Edit Task', 'taskform.sub':'Define what it is and how often it repeats',
    'taskform.name':'Name', 'taskform.xp':'XP Reward', 'taskform.color':'Color', 'taskform.repeat':'Repeat',
    'taskform.whichdays':'Which days', 'taskform.everyn':'Every N days', 'taskform.daterange':'Date Range',
    'taskform.save':'Save Task', 'taskform.delete':'Delete Task',
    'repeat.daily':'Every day', 'repeat.weekdays':'Weekdays', 'repeat.weekends':'Weekends', 'repeat.weekly':'Custom days',
    'repeat.everyx':'Every {n} days', 'repeat.everyxOption':'Every X Days', 'repeat.monthly':'Monthly', 'repeat.once':'One time',
    'daypanel.xp':'XP Earned', 'daypanel.notes':'Notes', 'daypanel.notesplaceholder':'How did today go?',
    'daypanel.completed':'{done} of {total} tasks completed',
    'deletescope.subtitle':'This task repeats. What would you like to delete?',
    'deletescope.only':'This event only', 'deletescope.future':'This and following events',
    'deletescope.all':'All events', 'deletescope.cancel':'Cancel',
    'account.title':'Account', 'account.dangerzone':'Danger Zone', 'account.deleteaccount':'Delete Account',
    'account.logout':'Log Out', 'account.signedinas':'Signed in as {u}', 'account.notsignedin':'Not signed in',
    'deleteaccount.title':'Delete account',
    'deleteaccount.sub':'This permanently erases your tasks, logs, and notes. Re-enter your username and password to confirm.',
    'deleteaccount.confirm':'Permanently Delete Account',
    'mobilemenu':'Menu',
    'sync.local':'Local only', 'sync.syncing':'Syncing…', 'sync.error':'Sync failed', 'sync.as':'Synced as {u}',
    'insight.streak':'Your current streak is {c} day{s}, longest ever is {l}.',
    'insight.bestday':'Your most productive day was {d} ({xp} XP).',
    'insight.avg':'Average completion rate over 30 days: {p}%.',
    'insight.improving':'Your consistency is up {p}% compared to the previous 30 days.',
    'insight.declining':'Your consistency is down {p}% compared to the previous 30 days.',
    'insight.perfectdays':'You\'ve had {n} perfect day{s} — every scheduled task done.',
  },
  th: {
    'nav.today':'วันนี้', 'nav.calendar':'ปฏิทิน', 'nav.tasks':'งาน', 'nav.analytics':'วิเคราะห์ข้อมูล', 'nav.install':'ติดตั้งแอป',
    'credit':'สร้างโดย เพิร์ธ',
    'about.title':'เกี่ยวกับ', 'about.name':'เพิร์ธ - พงษ์กร โชติปัญญาวรกุล', 'about.role':'ผู้สร้างและพัฒนา',
    'about.description':'Project Ascension คือระบบปฏิบัติการเพื่อความสม่ำเสมอส่วนตัว รวมปฏิทิน ตัวติดตามนิสัย ระบบ XP และแดชบอร์ดวิเคราะห์ข้อมูลไว้ในที่เดียว สร้างขึ้นเพื่อให้การทำสิ่งต่าง ๆ อย่างสม่ำเสมอในทุกวันกลายเป็นความก้าวหน้าที่มองเห็นได้จริง',
    'gate.subtitle':'เข้าสู่ระบบเพื่อดำเนินการต่อ', 'gate.login':'เข้าสู่ระบบ', 'gate.register':'สมัครสมาชิก',
    'gate.username':'ชื่อผู้ใช้', 'gate.password':'รหัสผ่าน',
    'gate.creating':'กำลังสร้างบัญชี…', 'gate.signing':'กำลังเข้าสู่ระบบ…',
    'gate.enterboth':'กรอกชื่อผู้ใช้และรหัสผ่าน', 'gate.checking':'กำลังตรวจสอบเซสชัน…',
    'gate.expired':'เซสชันหมดอายุ — กรุณาเข้าสู่ระบบอีกครั้ง', 'gate.createbtn':'สร้างบัญชี',
    'today.title':'วันนี้', 'today.newtask':'+ เพิ่มงาน', 'today.categories':'+ หมวดหมู่', 'today.xp':'XP วันนี้',
    'today.completion':'ความสำเร็จ', 'today.bestpct':'ความสำเร็จสูงสุด', 'today.bestxp':'XP สูงสุด',
    'today.uncategorized':'ไม่จัดหมวดหมู่',
    'today.empty':'ไม่มีงานสำหรับวันนี้ เพิ่มงานเพื่อเริ่มต้น',
    'calendar.title':'ปฏิทิน', 'calendar.sub':'คลิกวันที่เพื่อดูรายละเอียด',
    'calendar.prev':'← ก่อนหน้า', 'calendar.next':'ถัดไป →', 'calendar.today':'วันนี้',
    'analytics.title':'วิเคราะห์ข้อมูล', 'analytics.sub':'ความสม่ำเสมอของคุณ วัดผลได้',
    'analytics.overallsuccess':'อัตราความสำเร็จโดยรวม', 'analytics.todaystasks':'งานวันนี้', 'analytics.todaycompleted':'งานที่ทำสำเร็จวันนี้', 'analytics.todayrate':'อัตราความสำเร็จวันนี้',
    'analytics.avgpct':'เดือนที่ทำได้ดีที่สุด', 'analytics.avgxp':'XP เฉลี่ยต่อวัน (ทั้งหมด)',
    'analytics.bestday':'วันที่ทำได้ดีที่สุด',
    'analytics.monthlyheatmap':'แผนที่ความสำเร็จรายเดือน', 'analytics.currentmonth':'กราฟความสำเร็จ',
    'analytics.currentmonthxp':'กราฟ XP',
    'analytics.scatterplot':'กราฟกระจาย XP กับความสำเร็จ',
    'analytics.consistency':'คะแนนความสม่ำเสมอ (20 วัน)', 'analytics.perfectdays':'วันที่สมบูรณ์แบบ',
    'analytics.totalcompleted':'งานที่ทำสำเร็จ (ทั้งหมด)', 'analytics.activetasks':'งานที่เหลืออยู่', 'analytics.daystracked':'จำนวนวันที่ติดตาม',
    'analytics.overallsuccess':'อัตราความสำเร็จโดยรวม',
    'period.days':'วัน', 'period.thismonth':'เดือนนี้', 'period.months':'เดือน', 'period.years':'ปี',
    'taskform.newtitle':'เพิ่มงานใหม่', 'taskform.edittitle':'แก้ไขงาน', 'taskform.sub':'กำหนดรายละเอียดและความถี่ของงาน',
    'taskform.name':'ชื่องาน', 'taskform.xp':'XP ที่ได้รับ', 'taskform.color':'สี', 'taskform.repeat':'ความถี่',
    'taskform.whichdays':'เลือกวัน', 'taskform.everyn':'ทุก N วัน', 'taskform.daterange':'ช่วงวันที่',
    'taskform.save':'บันทึกงาน', 'taskform.delete':'ลบงาน',
    'repeat.daily':'ทุกวัน', 'repeat.weekdays':'วันธรรมดา', 'repeat.weekends':'วันหยุดสุดสัปดาห์', 'repeat.weekly':'กำหนดวันเอง',
    'repeat.everyx':'ทุก {n} วัน', 'repeat.everyxOption':'ทุก X วัน', 'repeat.monthly':'รายเดือน', 'repeat.once':'ครั้งเดียว',
    'daypanel.xp':'XP ที่ได้รับ', 'daypanel.notes':'บันทึก', 'daypanel.notesplaceholder':'วันนี้เป็นอย่างไรบ้าง?',
    'daypanel.completed':'ทำสำเร็จ {done} จาก {total} งาน',
    'deletescope.subtitle':'งานนี้เกิดซ้ำ คุณต้องการลบแบบใด?',
    'deletescope.only':'เฉพาะครั้งนี้', 'deletescope.future':'ครั้งนี้และครั้งถัดไปทั้งหมด',
    'deletescope.all':'ทุกครั้ง', 'deletescope.cancel':'ยกเลิก',
    'account.title':'บัญชี', 'account.dangerzone':'โซนอันตราย', 'account.deleteaccount':'ลบบัญชี',
    'account.logout':'ออกจากระบบ', 'account.signedinas':'เข้าสู่ระบบในชื่อ {u}', 'account.notsignedin':'ยังไม่ได้เข้าสู่ระบบ',
    'deleteaccount.title':'ลบบัญชี',
    'deleteaccount.sub':'การดำเนินการนี้จะลบงาน บันทึก และข้อมูลทั้งหมดอย่างถาวร กรอกชื่อผู้ใช้และรหัสผ่านอีกครั้งเพื่อยืนยัน',
    'deleteaccount.confirm':'ลบบัญชีอย่างถาวร',
    'mobilemenu':'เมนู',
    'sync.local':'ออฟไลน์', 'sync.syncing':'กำลังซิงค์…', 'sync.error':'ซิงค์ล้มเหลว', 'sync.as':'ซิงค์แล้วในชื่อ {u}',
    'insight.streak':'สถิติต่อเนื่องปัจจุบันของคุณคือ {c} วัน สูงสุดที่เคยทำได้คือ {l} วัน',
    'insight.bestday':'วันที่คุณทำได้ดีที่สุดคือ {d} ({xp} XP)',
    'insight.avg':'อัตราความสำเร็จเฉลี่ยใน 30 วันที่ผ่านมา: {p}%',
    'insight.improving':'ความสม่ำเสมอของคุณดีขึ้น {p}% เทียบกับ 30 วันก่อนหน้า',
    'insight.declining':'ความสม่ำเสมอของคุณลดลง {p}% เทียบกับ 30 วันก่อนหน้า',
    'insight.perfectdays':'คุณทำวันที่สมบูรณ์แบบได้ {n} วัน — ทำครบทุกงานที่กำหนด',
    'help.title':'วิธีใช้', 'help.subtitle':'คู่มือการใช้งานทุกฟีเจอร์',
    'help.gettingstarted':'เริ่มต้นใช้งาน',
    'help.gettingstarted.desc':'<strong>1. สร้างบัญชี</strong><br>คลิก "สมัครสมาชิก" บนหน้าเข้าสู่ระบบ กรอกชื่อผู้ใช้และรหัสผ่าน จากนั้นกด "สร้างบัญชี" ข้อมูลของคุณจะถูกบันทึกไว้ในเบราว์เซอร์ของอุปกรณ์นี้<br><br><strong>2. เข้าสู่ระบบ</strong><br>ใช้ชื่อผู้ใช้และรหัสผ่านที่สมัครไว้เพื่อเข้าสู่ระบบ แล้วระบบจะพาคุณไปยังหน้า "วันนี้" โดยอัตโนมัติ<br><br><strong>3. สร้างงานแรก</strong><br>คลิก "+ เพิ่มงาน" เพื่อสร้างนิสัย เป้าหมาย หรือกิจกรรมประจำวันที่ต้องการติดตาม<br><br><strong>4. ทำงานให้สำเร็จ</strong><br>เมื่อทำงานเสร็จแล้ว ให้กดเครื่องหมาย ✓ หน้ารายการงาน เพื่อรับ XP และอัปเดตความคืบหน้าของวัน',
    'help.todayview':'หน้า "วันนี้"',
    'help.todayview.desc':'หน้านี้เป็นศูนย์รวมงานทั้งหมดของวันนี้<br><br>คุณสามารถ<br>• ทำเครื่องหมายเมื่องานเสร็จ<br>• แก้ไขงานด้วยปุ่ม ✎<br>• ลบงานด้วยปุ่ม 🗑<br>• ลากเพื่อจัดลำดับงาน<br>• เพิ่มงานหรือหมวดหมู่ใหม่<br><br>ด้านบนจะแสดงข้อมูลสำคัญ ได้แก่<br>• XP ที่ได้รับวันนี้<br>• เปอร์เซ็นต์ความสำเร็จของวันนี้<br>• วันที่ทำสำเร็จได้สูงสุด<br>• วันที่ได้รับ XP สูงสุด',
    'help.creatingtasks':'การสร้างงาน',
    'help.creatingtasks.desc':'แต่ละงานสามารถกำหนดได้ดังนี้<br>• ชื่องาน<br>• ค่า XP<br>• สี<br>• หมวดหมู่<br>• รูปแบบการทำซ้ำ<br><br>ตัวเลือกการทำซ้ำ<br>• ทุกวัน<br>• วันจันทร์–ศุกร์<br>• วันเสาร์–อาทิตย์<br>• เลือกวันในสัปดาห์<br>• ทุก ๆ X วัน<br>• รายเดือน<br>• ทำครั้งเดียว<br><br>นอกจากนี้ยังสามารถกำหนดวันเริ่มต้นและวันสิ้นสุดของงานได้',
    'help.calendarview':'หน้าปฏิทิน',
    'help.calendarview.desc':'หน้า ปฏิทิน ใช้สำหรับดูประวัติและวางแผนล่วงหน้า<br><br>คุณสามารถ<br>• ดูข้อมูลของแต่ละเดือน<br>• ตรวจสอบงานที่ทำในแต่ละวัน<br>• เพิ่มบันทึกประจำวัน<br>• เพิ่มงานในวันที่ต้องการ<br>• ดู XP และเปอร์เซ็นต์ความสำเร็จย้อนหลัง<br><br>วันที่ที่มีสีเข้มกว่าจะหมายถึงวันที่มีผลงานมากกว่า',
    'help.analyticsview':'หน้าการวิเคราะห์',
    'help.analyticsview.desc':'หน้า การวิเคราะห์ ช่วยติดตามความสม่ำเสมอและพัฒนาการของคุณ<br><br>สามารถดูข้อมูลต่าง ๆ เช่น<br>• จำนวนงานที่ทำสำเร็จทั้งหมด<br>• จำนวนวันที่ใช้งาน<br>• อัตราความสำเร็จโดยรวม<br>• XP เฉลี่ยต่อวัน<br>• จำนวนวันที่ทำครบ 100%<br>• วันที่ได้รับ XP สูงที่สุด<br>• คะแนนความสม่ำเสมอในช่วง 20 วันที่ผ่านมา<br><br>พร้อมกราฟที่ช่วยให้เห็นแนวโน้มและพัฒนาการได้ชัดเจน',
    'help.deletingtasks':'การลบงานที่ทำซ้ำ',
    'help.deletingtasks.desc':'เมื่อลบงานที่ตั้งให้ทำซ้ำ ระบบจะให้เลือก<br>• ลบเฉพาะวันนี้<br>• ลบตั้งแต่วันนี้เป็นต้นไป<br>• ลบทั้งหมด<br>เพื่อให้คุณสามารถปรับเปลี่ยนตารางงานได้โดยไม่สูญเสียประวัติที่ต้องการเก็บไว้',
    'help.account':'บัญชีผู้ใช้',
    'help.account.desc':'ในหน้าการตั้งค่าบัญชี คุณสามารถ<br>• ออกจากระบบ<br>• ลบบัญชี<br><br>การลบบัญชีจะลบข้อมูลงาน ประวัติ และบันทึกทั้งหมดอย่างถาวร และไม่สามารถกู้คืนได้',
    'help.tips':'เคล็ดลับ',
    'help.tips.desc':'• เริ่มจากงานประจำวันง่าย ๆ ประมาณ 3–5 งาน<br>• กำหนด XP สูงให้กับงานที่สำคัญหรือท้าทาย<br>• ใช้หมวดหมู่เพื่อจัดระเบียบงาน<br>• ตรวจสอบหน้าการวิเคราะห์เป็นประจำ<br>• ใช้ปฏิทินเพื่อทบทวนและวางแผน<br>• เน้นความสม่ำเสมอมากกว่าความสมบูรณ์แบบ เพราะการทำต่อเนื่องสำคัญกว่าการทำได้ครบทุกวัน'
  }
};
export let currentLang = localStorage.getItem('ascend_lang') || 'en';
WEEKDAY_LABELS = currentLang==='th' ? WEEKDAY_LABELS_TH : WEEKDAY_LABELS_EN;
export function i18nText(key, vars){
  let s = (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
  if(vars) Object.keys(vars).forEach(k=> s = s.replace('{'+k+'}', vars[k]));
  return s;
}
export function setLanguage(lang){
  currentLang = lang;
  localStorage.setItem('ascend_lang', lang);
  WEEKDAY_LABELS = lang==='th' ? WEEKDAY_LABELS_TH : WEEKDAY_LABELS_EN;
  document.querySelectorAll('.lang-btn').forEach(b=> b.classList.toggle('active', b.id.endsWith('-'+lang)));
  applyLanguage();
}
export function applyLanguage(){
  document.querySelectorAll('[data-i18n]').forEach(el=> el.textContent = i18nText(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-html]').forEach(el=> el.innerHTML = i18nText(el.dataset.i18nHtml));
  document.querySelectorAll('[data-i18n-ph]').forEach(el=> el.placeholder = i18nText(el.dataset.i18nPh));
  // refresh whatever's currently on screen so dynamically-generated strings pick up the new language too
  if(afterApply) afterApply();
}

/* The language module can't import the view/gate modules (they import i18n),
   so main.js registers a callback that re-renders the active view, refreshes
   the gate tabs, and updates the sync indicator. */
let afterApply = null;
export function setAfterApply(fn){ afterApply = fn; }

