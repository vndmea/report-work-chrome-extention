const formDataContentType = "application/x-www-form-urlencoded; charset=UTF-8";
const baseUrl = "http://eoms.ultrapower.com.cn/ultrasoa/reportwork/";
const ErrorMessage = "JSESSIONID错误或已过期";

/** 用于获取时间，比较时间戳大小 */
function getTime(val) {
  return new Date(val).getTime();
}

new Vue({
  el: "#app",
  data() {
    return {
      activeStep: 1,
      checkedDates: [],
      calendarInfoList: [],
      checkAll: false,
      isIndeterminate: false,
      ruleForm: {
        dqdate: "2021-04-27",
        perdate: "2021-04-27",
        perglid: "YF-M-2021-0008-L1",
        perglname: "文本机器人",
        pergltype: "项目",
        perisrw: "",
        perpid: "",
        perstatus: "",
        pertext: "文本机器人研发配置",
        pertitle: "项目报工",
        perworktype1: "110000",
        perworktype2: "110400",
        perworktype3: "",
      },
      ruleFormOfReport: {
        batchrjistravel: "否",
        batchrjrole: "开发人员",
        batchworkplace1: "110000",
        batchworkplace2: "110100",
        datefrom: "2021-04-26",
        dateto: "2021-05-21",
      },
      rules: {
        datefrom: [
          { required: true, message: "请选择开始时间", trigger: "change" },
        ],
        dateto: [
          { required: true, message: "请选择结束时间", trigger: "change" },
        ],
        batchworkplace2: [
          { required: true, message: "请选择工作地点", trigger: "change" },
        ],
        batchrjrole: [
          { required: true, message: "请选择项目角色", trigger: "change" },
        ],
        batchrjistravel: [
          { required: true, message: "请选择是否出差", trigger: "change" },
        ],
        pertitle: [
          { required: true, message: "请输入标题", trigger: "change" },
        ],
        perworktype3: [
          { required: true, message: "请选择工作类型", trigger: "change" },
        ],
        perglid: [
          { required: true, message: "请选择项目编号", trigger: "change" },
        ],
        pertext: [{ required: true, message: "请输入内容", trigger: "change" }],
      },
      reportDisabled: true, //批量报工按钮
      deleteLogsDisabled: true, //删除日志按钮
      recallReportDisabled: true, //撤销报工按钮
      saveLogsDisabled: false, //填报日志按钮
      deleteLogsVisible: false, //删除日志按钮
      recallReporVisible: false, //撤销报工按钮
      cityData: [],
      provinceData: [],
      reportDate: "",
      JSESSIONID: "",
      perworkData0: [
        { code: "110000", cname: "工作" },
        { code: "120000", cname: "休息" },
      ],
      perworkData: [],
      perworkData1: [],
      prevDataList: [],
      nextDataList: [],
      currentLastDate: false,
      dateJson: {
        prev: { y: 2021, m: 4, s: "26", e: 30 },
        current: { y: 2021, m: 5, s: 1, e: 25 },
        next: { y: 2021, m: 6, s: 1, e: 25 },
      },
      pickerOptions: {},
    };
  },
  computed: {
    // 是否日志没有填完之前禁用第二步的报工
    // nextStepDisabled(){
    //   return this.availableDates.length > 0
    // },
    availableDates() {
      return this.calendarInfoList
        .filter((item) => {
          // rjstatus === "-1" && pertitle === "-1" 未填报日志
          // rjstatus === "-1" && pertitle !== "-1" 处于已经填报日志状态
          // rjstatus === "0"  && pertitle !== "-1" 报工撤销,处于已经填报日志状态
          // rjstatus === "1" 处于已经报工状态
          // rjstatus === "5" 处于报工通过状态
          // isholiday === "1" 该日期休息
          return (
            item.isholiday !== "1" &&
            item.rjstatus !== "5" &&
            item.rjstatus !== "1" &&
            item.rjstatus !== "0" &&
            item.pertitle === "-1" &&
            getTime(item.tdate) <= getTime(this.reportDate.slice(12))
          );
        })
        .map((item) => item.tdate);
    },
  },
  mounted() {
    // 1. 获取可报工区间
    this.getPLReportDate()
      .then(({ data }) => {
        // 处理是否可以报工参数
        this.setInitValues(data); //reportDate, ruleFormOfReport
        this.setReportDateRange(data); //dateJson, currentLastDate
        this.getWorktypeInfo(2, "110000");
      })
      .then(() => {
        this.getCalendarInfo();
      })
      .catch(({ message }) => {
        this.$message({
          message: "未登录或数据异常，请先登录或联系前端同学",
          type: "error",
          duration: 0,
        });
        console.log("error: getPLReportDate", message);
      });
  },
  methods: {
    // 分拆函数，设置值
    setInitValues(data) {
      this.reportDate = data;
      this.ruleFormOfReport.datefrom = data.slice(0, 10);
      this.ruleFormOfReport.dateto = data.slice(12);
      this.pickerOptions.disabledDate = (time) => {
        return (
          dayjs(time).isBefore(dayjs(this.ruleFormOfReport.datefrom)) ||
          dayjs(time).isAfter(dayjs(this.ruleFormOfReport.dateto))
        );
      };
    },
    // 分拆函数，设置报工区间
    setReportDateRange(data) {
      let current = this.dateJson.current; //当前月
      let next = this.dateJson.next; //下个月
      let prev = this.dateJson.prev; //上个月
      if (Number(data.slice(20)) > 25) {
        this.currentLastDate = true;
        current.y = Number(data.slice(12, 16));
        current.m = Number(data.slice(17, 19));
        current.s = 26;
        current.e = new Date(current.y, current.m, 0).getDate();
        if (current.m === 12) {
          next.y = current.y + 1;
          next.m = 1;
        } else {
          next.y = current.y;
          next.m = current.m + 1;
        }
      } else {
        this.currentLastDate = false;
        prev.y = data.slice(0, 4);
        prev.m = Number(data.slice(5, 7));
        prev.e = new Date(prev.y, prev.m, 0).getDate();
        current.y = data.slice(12, 16);
        current.m = Number(data.slice(17, 19));
        current.s = 1;
        current.e = 25;
      }
    },
    // 获取可报工区间
    getPLReportDate() {
      return axios.post(baseUrl + "getPLReportDate").then((res) => {
        if (res.data.includes("神州泰岳生产信息化系统")) {
          return Promise.reject(ErrorMessage);
        } else {
          return res;
        }
      });
    },
    //获取是否可以报工接口
    getCalendarInfo() {
      return axios({
        method: "POST",
        headers: { "Content-Type": formDataContentType },
        url: baseUrl + "getCalendarInfo",
        data: Qs.stringify({ dateJson: JSON.stringify(this.dateJson) }),
      }).then((res) => {
        if (this.currentLastDate) {
          this.calendarInfoList = [].concat(res.data.current, res.data.next);
        } else {
          this.calendarInfoList = [].concat(res.data.prev, res.data.current);
        }
      });
    },
    //获取工作类型下啦数据接口
    getWorktypeInfo(worktype, workcode) {
      axios({
        method: "POST",
        headers: {
          "Content-Type": formDataContentType,
        },
        url: baseUrl + "getWorktypeInfo",
        data: Qs.stringify({
          worktype,
          workcode,
        }),
      }).then((res) => {
        if (worktype === 2) {
          this.perworkData1 = [];
          this.perworkData = res.data;

          const type2codes = res.data.map((i) => i.code);
          if (!type2codes.includes(this.ruleForm.perworktype2)) {
            this.ruleForm.perworktype2 = "";
            this.ruleForm.perworktype3 = "";
          }

          if (
            this.ruleForm.perworktype2 === "110400" &&
            this.ruleForm.perworktype3 === ""
          ) {
            this.getWorktypeInfo(3, "110400");
          }
        } else {
          // worktype === 3
          const type3codes = res.data.map((i) => i.code);
          if (!type3codes.includes(this.ruleForm.perworktype3)) {
            this.ruleForm.perworktype3 = "";
          }

          this.perworkData1 = res.data;
          if (workcode === "110400" && this.ruleForm.perworktype3 === "") {
            this.ruleForm.perworktype3 = "110403";
          }
        }
      });
    },
    //切换项目编号事件
    handlePergl(val) {
      if (val === "YF-M-2021-0008-L1") {
        this.ruleForm.perglname = "文本机器人";
        this.ruleForm.pertext = "文本机器人研发配置";
      } else {
        this.ruleForm.perglname = "语音机器人";
        this.ruleForm.pertext = "语音机器人研发配置";
      }
    },
    // 切换关联类型
    async handleChangePergltype() {
      if (this.ruleForm.pergltype === "部门") {
        const res = await axios.post(baseUrl + "getCurrentDep");
        this.ruleForm.perglname = res.data.depname;
        this.ruleForm.perglid = res.data.depid;
        this.ruleForm.pertext = "工作";
      } else {
        this.ruleForm.perglname = "文本机器人";
        this.ruleForm.perglid = "YF-M-2021-0008-L1";
        this.ruleForm.pertext = "文本机器人研发配置";
      }
    },
    getPerworktype(type, code) {
      var list = [];
      switch (type) {
        case 1:
          list = this.perworkData0;
          break;
        case 2:
          list = this.perworkData;
          break;
        case 3:
          list = this.perworkData1;
          break;
      }
      return list.find((item) => item.code === code).cname;
    },
    getBatchworkplace(type, code) {
      var list = [];
      switch (type) {
        case 1:
          list = this.provinceData;
          break;
        case 2:
          list = this.cityData;
          break;
      }
      return list.find((item) => item.code === code).cname;
    },
    //提交填报日志表单
    submitForm() {
      if (!this.checkedDates.length) {
        this.$message.warning("请至少选中一天日期进行日志填报");
        return;
      }
      this.$refs["ruleForm"].validate((valid) => {
        if (valid) {
          const {
            pergltype,
            perglname,
            pertitle,
            pertext,
            perglid,
            perworktype1,
            perworktype2,
            perworktype3,
          } = this.ruleForm;
          const dateStr = this.checkedDates
            .map((i) => i.slice(5).replace("-", "/"))
            .join(", ");

          this.$confirm(
            `【标题】：${pertitle}<br>
            【填报日期】：${dateStr}<br>
            【工作类型】：
            ${this.getPerworktype(1, perworktype1)} -
            ${this.getPerworktype(2, perworktype2)} -
            ${this.getPerworktype(3, perworktype3)}<br>
            【关联类型】：${pergltype} - ${perglid} - ${perglname}<br>
            【内容】：${pertext}`,
            "确认日志填报内容",
            {
              dangerouslyUseHTMLString: true,
              confirmButtonText: "提交",
              cancelButtonText: "取消",
              type: "success",
            }
          )
            .then(() => {
              return Promise.all(
                this.checkedDates.map((item) => {
                  this.ruleForm.dqdate = item;
                  this.ruleForm.perdate = item;
                  return axios.post(baseUrl + "savePersonLogs", {
                    rwPerson: this.ruleForm,
                  });
                })
              );
            })
            .then(() => {
              // 刷新列表
              this.getCalendarInfo();
              this.checkedDates = [];
              this.isIndeterminate = false;
              this.$message.warning("填报日志成功，请点击【下一步】进入批量报工页面完成报工");
            })
            .catch((error) => {
              console.log(error.message);
            });
        }
      });
    },
    nextStep() {
      this.activeStep = 2;
      document.documentElement.scrollTop = 0;
      this.getCity(1, "");
    },
    prevStep() {
      this.activeStep = 1;
    },
    //多选事件
    handleCheckAllChange(val) {
      this.checkedDates = val ? this.availableDates : [];
      this.isIndeterminate = false;
    },
    // 多选框值改变
    handleCheckedCitiesChange(value) {
      let checkedCount = value.length;
      this.checkAll = checkedCount === this.availableDates.length;
      this.isIndeterminate =
        checkedCount > 0 && checkedCount < this.availableDates.length;
    },

    //获取批量报工城市接口
    getCity(citytype, citycode) {
      return axios({
        method: "POST",
        headers: {
          "Content-Type": formDataContentType,
        },
        url: baseUrl + "getCity",
        data: Qs.stringify({ citytype, citycode }),
      }).then((res) => {
        if (citytype === 1) {
          this.provinceData = res.data;
          if (this.ruleFormOfReport.batchworkplace1 === "110000") {
            this.getCity(2, "110000");
          }
        } else {
          this.cityData = res.data;
          if (
            this.ruleFormOfReport.batchworkplace1 === "110000" &&
            this.ruleFormOfReport.batchworkplace2 === ""
          ) {
            this.ruleFormOfReport.batchworkplace2 = "110100";
          } else {
            this.ruleFormOfReport.batchworkplace2 = res.data[0].code;
          }
        }
      });
    },
    //提交批量报工表单
    submitFormOfReport() {
      this.$refs["ruleFormOfReport"].validate((valid) => {
        if (valid) {
          const {
            datefrom,
            dateto,
            batchworkplace1,
            batchworkplace2,
            batchrjrole,
            batchrjistravel,
          } = this.ruleFormOfReport;
          this.$confirm(
            `【报工日期】：
            ${datefrom.replaceAll("-", "/")} - 
            ${dateto.replaceAll("-", "/")}<br>
            【工作地点】：
            ${this.getBatchworkplace(1, batchworkplace1)} - 
            ${this.getBatchworkplace(2, batchworkplace2)}<br>
            【项目角色】：${batchrjrole}<br>
            【是否出差】：${batchrjistravel}`,
            "确认报工内容",
            {
              dangerouslyUseHTMLString: true,
              confirmButtonText: "完成报工",
              cancelButtonText: "取消",
              type: "success",
            }
          )
            .then(() => {
              return axios.post(
                baseUrl + "batchReportJob",
                this.ruleFormOfReport
              );
            })
            .then(() => {
              return this.$confirm(
                "报工最终以PMO为考勤结果，是否前往查看",
                "报工成功",
                {
                  confirmButtonText: "确定",
                  cancelButtonText: "取消",
                  type: "success",
                }
              );
            })
            .then(() => {
              window.open(
                "http://eoms.ultrapower.com.cn/ultrasoa/reportwork/ReportWork"
              );
            })
            .catch((error) => {
              console.log(error.message);
            });
        }
      });
    },
  },
});
