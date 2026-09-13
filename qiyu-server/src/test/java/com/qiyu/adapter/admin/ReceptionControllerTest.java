package com.qiyu.adapter.admin;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@SpringBootTest
@ActiveProfiles("mock")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ReceptionControllerTest {
    @Autowired
    private MockMvc mockMvc;
    private String adminToken;

    @BeforeEach
    void login() throws Exception {
        String body = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clientType":"ADMIN_WEB","grantType":"PASSWORD","identifier":"admin","credential":"123456"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        adminToken = JsonPath.read(body, "$.data.accessToken");
    }

    @Test
    void receptionListPaginatesRowsButCountsTheCompleteFilteredResult() throws Exception {
        mockMvc.perform(get("/admin/reception/bookings")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("storeId", "store-jingan")
                        .param("pageNum", "1")
                        .param("pageSize", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.list", hasSize(1)))
                .andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.counts.BOOKED").value(2))
                .andExpect(jsonPath("$.data.counts.PENDING_PAYMENT").value(1));
    }

    @Test
    void receptionCheckinRequiresResolveAndIsIdempotentOnRepeat() throws Exception {
        MvcResult detail = mockMvc.perform(get("/admin/reception/bookings/BK-202608-1000")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andReturn();
        String detailBody = detail.getResponse().getContentAsString();
        String code = JsonPath.read(detailBody, "$.data.booking.verificationCode");
        Number version = JsonPath.read(detailBody, "$.data.version");

        mockMvc.perform(post("/admin/reception/checkin/resolve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"storeId\":\"store-jingan\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.booking.status").value("BOOKED"));

        String confirmation = "{\"storeId\":\"store-jingan\",\"code\":\"" + code
                + "\",\"bookingId\":\"BK-202608-1000\",\"version\":" + version.longValue() + "}";
        mockMvc.perform(post("/admin/reception/checkin/confirm")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(confirmation))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.booking.status").value("CHECKED_IN"));
        mockMvc.perform(post("/admin/reception/checkin/confirm")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(confirmation))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.booking.status").value("CHECKED_IN"));
    }

    @Test
    void inlineCustomerCreationNormalizesAndReusesMobile() throws Exception {
        String request = "{\"storeId\":\"store-jingan\",\"mobile\":\"+86 139-0000-9999\",\"name\":\"新客张女士\"}";
        MvcResult created = mockMvc.perform(post("/admin/reception/customers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mobile").value("13900009999"))
                .andReturn();
        String customerId = JsonPath.read(created.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(post("/admin/reception/customers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(customerId));
    }

    @Test
    void storeManagerCanCreateCustomersOnlyInsideThePrimaryStore() throws Exception {
        String loginBody = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"clientType":"ADMIN_WEB","grantType":"PASSWORD","identifier":"manager","credential":"123456"}
                                """))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String managerToken = JsonPath.read(loginBody, "$.data.accessToken");
        String customer = "{\"storeId\":\"store-jingan\",\"mobile\":\"13900008888\",\"name\":\"门店新客\"}";
        mockMvc.perform(post("/admin/reception/customers")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(customer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mobile").value("13900008888"));
        mockMvc.perform(post("/admin/reception/customers")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"storeId\":\"store-xujiahui\",\"mobile\":\"13900007777\",\"name\":\"跨店新客\"}"))
                .andExpect(status().isForbidden());
    }
}
