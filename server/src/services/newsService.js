const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');

class NewsService {
  /**
   * Lấy tin tức từ Bộ Y tế Việt Nam
   */
  static async getMOHNews() {
    try {
      console.log('News: Fetching news from Ministry of Health Vietnam');
      
      const response = await axios.get('https://moh.gov.vn/tin-tuc', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const news = [];

      // Parse tin tức từ trang Bộ Y tế
      $('.news-item, .tin-tuc-item, .article-item').each((index, element) => {
        if (index < 5) { // Lấy 5 tin mới nhất
          const title = $(element).find('h3, h4, .title, .news-title').text().trim();
          const description = $(element).find('.summary, .description, .excerpt').text().trim();
          const link = $(element).find('a').attr('href');
          const dateText = $(element).find('.date, .time, .published-date').text().trim();

          if (title && description) {
            news.push({
              type: 'health_policy',
              title: title,
              description: description,
              source: 'Bộ Y tế Việt Nam',
              region: 'Toàn quốc',
              date: this.parseVietnameseDate(dateText) || new Date(),
              link: link ? `https://moh.gov.vn${link}` : null,
              category: 'Chính sách y tế'
            });
          }
        }
      });

      console.log(`News: Fetched ${news.length} news from MOH`);
      return news;
    } catch (error) {
      console.warn('News: Failed to fetch MOH news, using fallback data:', error.message);
      return this.getFallbackMOHNews();
    }
  }

  /**
   * Lấy tin tức từ Cục Quản lý Dược
   */
  static async getDrugAdminNews() {
    try {
      console.log('News: Fetching news from Drug Administration of Vietnam');
      
      const response = await axios.get('https://dav.gov.vn/tin-tuc', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const news = [];

      // Parse tin tức từ trang Cục Quản lý Dược
      $('.news-item, .tin-tuc-item, .article-item').each((index, element) => {
        if (index < 3) { // Lấy 3 tin mới nhất
          const title = $(element).find('h3, h4, .title, .news-title').text().trim();
          const description = $(element).find('.summary, .description, .excerpt').text().trim();
          const link = $(element).find('a').attr('href');
          const dateText = $(element).find('.date, .time, .published-date').text().trim();

          if (title && description) {
            news.push({
              type: 'drug_regulation',
              title: title,
              description: description,
              source: 'Cục Quản lý Dược',
              region: 'Toàn quốc',
              date: this.parseVietnameseDate(dateText) || new Date(),
              link: link ? `https://dav.gov.vn${link}` : null,
              category: 'Quản lý dược phẩm'
            });
          }
        }
      });

      console.log(`News: Fetched ${news.length} news from Drug Admin`);
      return news;
    } catch (error) {
      console.warn('News: Failed to fetch Drug Admin news, using fallback data:', error.message);
      return this.getFallbackDrugAdminNews();
    }
  }

  /**
   * Lấy tin tức từ RSS feed của các bệnh viện lớn
   */
  static async getHospitalRSSNews() {
    try {
      console.log('News: Fetching news from hospital RSS feeds');
      
      const parser = new Parser();
      const news = [];

      // RSS feed từ Bệnh viện Bạch Mai
      try {
        const bachMaiFeed = await parser.parseURL('https://bachmai.gov.vn/rss');
        bachMaiFeed.items.slice(0, 2).forEach(item => {
          news.push({
            type: 'hospital_update',
            title: item.title,
            description: item.contentSnippet || item.content || 'Không có mô tả',
            source: 'Bệnh viện Bạch Mai',
            region: 'Hà Nội',
            date: new Date(item.pubDate),
            link: item.link,
            category: 'Cập nhật bệnh viện'
          });
        });
      } catch (error) {
        console.warn('News: Failed to fetch Bach Mai RSS:', error.message);
      }

      // RSS feed từ Bệnh viện Nhi Trung ương
      try {
        const nhiTrungUongFeed = await parser.parseURL('https://nhitrunguong.org.vn/rss');
        nhiTrungUongFeed.items.slice(0, 2).forEach(item => {
          news.push({
            type: 'pediatric_news',
            title: item.title,
            description: item.contentSnippet || item.content || 'Không có mô tả',
            source: 'Bệnh viện Nhi Trung ương',
            region: 'Hà Nội',
            date: new Date(item.pubDate),
            link: item.link,
            category: 'Tin tức nhi khoa'
          });
        });
      } catch (error) {
        console.warn('News: Failed to fetch Nhi Trung Uong RSS:', error.message);
      }

      console.log(`News: Fetched ${news.length} news from hospital RSS feeds`);
      return news;
    } catch (error) {
      console.warn('News: Failed to fetch hospital RSS news, using fallback data:', error.message);
      return this.getFallbackHospitalNews();
    }
  }

  /**
   * Lấy tin tức từ các hiệp hội dược phẩm
   */
  static async getPharmaAssociationNews() {
    try {
      console.log('News: Fetching news from pharmaceutical associations');
      
      const news = [];

      // Hiệp hội Dược phẩm Việt Nam
      try {
        const response = await axios.get('https://vnpca.org.vn/tin-tuc', {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const $ = cheerio.load(response.data);
        $('.news-item, .tin-tuc-item').each((index, element) => {
          if (index < 2) {
            const title = $(element).find('h3, h4, .title').text().trim();
            const description = $(element).find('.summary, .description').text().trim();
            const link = $(element).find('a').attr('href');

            if (title && description) {
              news.push({
                type: 'industry_update',
                title: title,
                description: description,
                source: 'Hiệp hội Dược phẩm Việt Nam',
                region: 'Toàn quốc',
                date: new Date(),
                link: link ? `https://vnpca.org.vn${link}` : null,
                category: 'Phát triển ngành dược'
              });
            }
          }
        });
      } catch (error) {
        console.warn('News: Failed to fetch VNPCA news:', error.message);
      }

      console.log(`News: Fetched ${news.length} news from pharma associations`);
      return news;
    } catch (error) {
      console.warn('News: Failed to fetch pharma association news, using fallback data:', error.message);
      return this.getFallbackPharmaNews();
    }
  }

  /**
   * Lấy tin tức từ các trang tin tức y tế uy tín
   */
  static async getHealthMediaNews() {
    try {
      console.log('News: Fetching news from health media sources');
      
      const news = [];

      // Sức khỏe & Đời sống
      try {
        const response = await axios.get('https://suckhoedoisong.vn/tin-tuc', {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const $ = cheerio.load(response.data);
        $('.news-item, .tin-tuc-item').each((index, element) => {
          if (index < 3) {
            const title = $(element).find('h3, h4, .title').text().trim();
            const description = $(element).find('.summary, .description').text().trim();
            const link = $(element).find('a').attr('href');

            if (title && description) {
              news.push({
                type: 'health_media',
                title: title,
                description: description,
                source: 'Sức khỏe & Đời sống',
                region: 'Toàn quốc',
                date: new Date(),
                link: link ? `https://suckhoedoisong.vn${link}` : null,
                category: 'Tin tức y tế'
              });
            }
          }
        });
      } catch (error) {
        console.warn('News: Failed to fetch Suc Khoe Doi Song news:', error.message);
      }

      console.log(`News: Fetched ${news.length} news from health media`);
      return news;
    } catch (error) {
      console.warn('News: Failed to fetch health media news, using fallback data:', error.message);
      return this.getFallbackHealthMediaNews();
    }
  }

  /**
   * Lấy tất cả tin tức từ các nguồn
   */
  static async getAllNews() {
    try {
      console.log('News: Fetching all news from multiple sources');
      
      const [mohNews, drugAdminNews, hospitalNews, pharmaNews, mediaNews] = await Promise.allSettled([
        this.getMOHNews(),
        this.getDrugAdminNews(),
        this.getHospitalRSSNews(),
        this.getPharmaAssociationNews(),
        this.getHealthMediaNews()
      ]);

      const allNews = [
        ...(mohNews.status === 'fulfilled' ? mohNews.value : []),
        ...(drugAdminNews.status === 'fulfilled' ? drugAdminNews.value : []),
        ...(hospitalNews.status === 'fulfilled' ? hospitalNews.value : []),
        ...(pharmaNews.status === 'fulfilled' ? pharmaNews.value : []),
        ...(mediaNews.status === 'fulfilled' ? mediaNews.value : [])
      ];

      // Sắp xếp theo ngày mới nhất
      allNews.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log(`News: Total ${allNews.length} news fetched from all sources`);
      return allNews;
    } catch (error) {
      console.error('News: Error fetching all news:', error);
      return this.getAllFallbackNews();
    }
  }

  /**
   * Parse ngày tháng tiếng Việt
   */
  static parseVietnameseDate(dateText) {
    if (!dateText) return new Date();
    
    try {
      // Xử lý các format ngày tháng phổ biến
      const date = new Date(dateText);
      if (!isNaN(date.getTime())) return date;
      
      // Xử lý format "dd/mm/yyyy"
      const parts = dateText.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      
      return new Date();
    } catch (error) {
      return new Date();
    }
  }

  // Fallback data khi không thể lấy tin tức thực tế
  static getFallbackMOHNews() {
    return [
      {
        type: 'health_policy',
        title: 'Bộ Y tế ban hành quy định mới về quản lý dược phẩm',
        description: 'Quy định mới nhằm nâng cao chất lượng và an toàn dược phẩm tại Việt Nam',
        source: 'Bộ Y tế Việt Nam',
        region: 'Toàn quốc',
        date: new Date(),
        category: 'Chính sách y tế'
      }
    ];
  }

  static getFallbackDrugAdminNews() {
    return [
      {
        type: 'drug_regulation',
        title: 'Cục Quản lý Dược cập nhật danh mục thuốc thiết yếu',
        description: 'Danh mục thuốc thiết yếu được cập nhật theo tiêu chuẩn quốc tế',
        source: 'Cục Quản lý Dược',
        region: 'Toàn quốc',
        date: new Date(),
        category: 'Quản lý dược phẩm'
      }
    ];
  }

  static getFallbackHospitalNews() {
    return [
      {
        type: 'hospital_update',
        title: 'Bệnh viện Bạch Mai triển khai công nghệ y tế mới',
        description: 'Ứng dụng AI và robot trong chẩn đoán và điều trị bệnh',
        source: 'Bệnh viện Bạch Mai',
        region: 'Hà Nội',
        date: new Date(),
        category: 'Cập nhật bệnh viện'
      }
    ];
  }

  static getFallbackPharmaNews() {
    return [
      {
        type: 'industry_update',
        title: 'Ngành dược phẩm Việt Nam tăng trưởng mạnh',
        description: 'Doanh thu ngành dược tăng 15% so với cùng kỳ năm trước',
        source: 'Hiệp hội Dược phẩm Việt Nam',
        region: 'Toàn quốc',
        date: new Date(),
        category: 'Phát triển ngành dược'
      }
    ];
  }

  static getFallbackHealthMediaNews() {
    return [
      {
        type: 'health_media',
        title: 'Xu hướng sử dụng thuốc Đông y tại Việt Nam',
        description: 'Người dân ngày càng quan tâm đến thuốc Đông y và thực phẩm chức năng',
        source: 'Sức khỏe & Đời sống',
        region: 'Toàn quốc',
        date: new Date(),
        category: 'Tin tức y tế'
      }
    ];
  }

  static getAllFallbackNews() {
    return [
      ...this.getFallbackMOHNews(),
      ...this.getFallbackDrugAdminNews(),
      ...this.getFallbackHospitalNews(),
      ...this.getFallbackPharmaNews(),
      ...this.getFallbackHealthMediaNews()
    ];
  }
}

module.exports = NewsService;
