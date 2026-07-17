package com.vevui.newsservice.config;

import com.vevui.newsservice.entity.Category;
import com.vevui.newsservice.entity.News;
import com.vevui.newsservice.repository.CategoryRepository;
import com.vevui.newsservice.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * DataSeeder — Seed dữ liệu tin tức qua JPA (không qua init.sql)
 *
 * init.sql chạy qua PowerShell pipe bị corrupt UTF-8.
 * Seeder này insert dữ liệu qua JDBC connection nên encoding đúng.
 *
 * Chỉ chạy khi bảng news rỗng hoặc có dữ liệu garbled (title chứa '?').
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final NewsRepository newsRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedCategories();
        seedNews();
    }

    private void seedCategories() {
        if (categoryRepository.count() >= 5) return;
        log.info("Seeding news_categories...");
        saveIfNotExists(categoryRepository, "Khuyen mai", 1);
        saveIfNotExists(categoryRepository, "Tin tuc", 2);
        saveIfNotExists(categoryRepository, "Huong dan", 3);
        saveIfNotExists(categoryRepository, "Du lich", 4);
        saveIfNotExists(categoryRepository, "Thong bao", 5);
    }

    private void seedNews() {
        // Kiểm tra nếu dữ liệu bị garbled (title chứa '?') thì xóa và seed lại
        long count = newsRepository.count();
        if (count >= 6) {
            boolean hasGarbled = newsRepository.findAll().stream()
                    .anyMatch(n -> n.getTitle() == null || n.getTitle().contains("?"));
            if (!hasGarbled) {
                log.info("News data already seeded correctly ({} articles)", count);
                return;
            }
            log.warn("Found garbled news data ({} articles), re-seeding...", count);
            newsRepository.deleteAllInBatch();
        }

        log.info("Seeding news articles via JPA...");

        newsRepository.save(News.builder()
                .slug("ve-vui-khuyen-mai-mua-he-2024")
                .title("Vé Vui khuyến mãi mùa hè - Giảm đến 30% toàn bộ tuyến!")
                .excerpt("Nhân dịp mùa hè rực rỡ, Vé Vui tung chương trình khuyến mãi đặc biệt với mức giảm lên đến 30% cho tất cả các tuyến trong tháng 6, 7, 8.")
                .content("<p>Mùa hè 2024 đã đến! Vé Vui trân trọng thông báo chương trình khuyến mãi đặc biệt với mức giảm lên đến 30% cho tất cả các tuyến. Sử dụng mã <strong>SUMMER20</strong> để nhận ưu đãi.</p>")
                .category("Khuyen mai")
                .imageUrl("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800")
                .author("Vé Vui Team")
                .views(1520L)
                .featured(true)
                .published(true)
                .build());

        newsRepository.save(News.builder()
                .slug("tuyen-moi-hcm-phu-quoc")
                .title("Khai trương tuyến mới TP.HCM - Phú Quốc, xuất phát từ tháng 7")
                .excerpt("Vé Vui chính thức mở tuyến xe khách đến thiên đường biển đảo Phú Quốc, với xe Limousine cao cấp.")
                .content("<p>Đáp ứng nhu cầu du lịch ngày càng cao, Vé Vui khai trương tuyến mới TP.HCM - Phú Quốc với đội xe Limousine 22 chỗ cao cấp.</p>")
                .category("Tin tuc")
                .imageUrl("https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800")
                .author("Vé Vui Team")
                .views(892L)
                .featured(true)
                .published(true)
                .build());

        newsRepository.save(News.builder()
                .slug("huong-dan-dat-ve-tren-dien-thoai")
                .title("Hướng dẫn đặt vé trực tuyến trên điện thoại chỉ 2 phút")
                .excerpt("Đặt vé nhanh chóng, tiện lợi ngay trên website Vé Vui mà không cần ra bến xe.")
                .content("<p>Bước 1: Truy cập website vevui.vn<br>Bước 2: Chọn điểm đi và điểm đến<br>Bước 3: Chọn ngày đi<br>Bước 4: Chọn chuyến phù hợp<br>Bước 5: Chọn ghế và thanh toán</p>")
                .category("Huong dan")
                .imageUrl("https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800")
                .author("Vé Vui Team")
                .views(2341L)
                .featured(false)
                .published(true)
                .build());

        newsRepository.save(News.builder()
                .slug("kinh-nghiem-di-da-lat-tu-hcm")
                .title("10 kinh nghiệm du lịch Đà Lạt từ TP.HCM bằng xe khách")
                .excerpt("Những mẹo hay giúp chuyến đi Đà Lạt của bạn trở nên dễ dàng và thú vị hơn khi di chuyển bằng xe khách.")
                .content("<p>Đà Lạt - thành phố ngàn hoa luôn là điểm đến yêu thích. Hãy cùng Vé Vui khám phá 10 mẹo hay để có chuyến đi hoàn hảo.</p>")
                .category("Du lich")
                .imageUrl("https://images.unsplash.com/photo-1563492065-6135a42ab0a9?w=800")
                .author("Vé Vui Team")
                .views(3150L)
                .featured(false)
                .published(true)
                .build());

        newsRepository.save(News.builder()
                .slug("chinh-sach-hoan-doi-ve-moi")
                .title("Chính sách hoàn - đổi vé mới nhất tại Vé Vui")
                .excerpt("Cập nhật chính sách hoàn vé và đổi vé linh hoạt nhất, đảm bảo quyền lợi tối đa cho hành khách.")
                .content("<p>Vé Vui luôn đặt sự hài lòng của khách hàng lên hàng đầu. Chính sách hoàn vé mới nhất: trước 24h - hoàn 100%, trước 2h - hoàn 50%, sau giờ khởi hành - không hoàn.</p>")
                .category("Thong bao")
                .imageUrl("https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800")
                .author("Vé Vui Team")
                .views(780L)
                .featured(false)
                .published(true)
                .build());

        newsRepository.save(News.builder()
                .slug("xe-limousine-cao-cap-moi")
                .title("Ra mắt đội xe Limousine cao cấp: Sang trọng - Tiện nghi - Đúng giờ")
                .excerpt("Vé Vui đầu tư thêm 10 xe Limousine 22 chỗ cao cấp, nâng cao trải nghiệm hành khách trên các tuyến dài.")
                .content("<p>Với mong muốn mang lại trải nghiệm tốt nhất, Vé Vui vừa đưa vào vận hành 10 xe Limousine 22 chỗ mới nhất, trang bị đầy đủ tiện nghi hiện đại.</p>")
                .category("Tin tuc")
                .imageUrl("https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800")
                .author("Vé Vui Team")
                .views(1100L)
                .featured(false)
                .published(true)
                .build());

        log.info("Seeded 6 news articles with proper Vietnamese UTF-8");
    }

    private void saveIfNotExists(CategoryRepository repo, String name, int sortOrder) {
        if (!repo.existsByNameIgnoreCase(name)) {
            repo.save(Category.builder().name(name).sortOrder(sortOrder).active(true).build());
        }
    }
}
