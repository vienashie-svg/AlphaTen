#include <iostream>

int main() {
    double completedTasks = 0;
    double totalTasks = 0;

    // Babasahin ang data na ipapasa ng Node.js (Format: completed total)
    if (std::cin >> completedTasks >> totalTasks) {
        if (totalTasks == 0) {
            std::cout << 0;
            return 0;
        }
        
        // Formula para sa progress percentage
        double percentage = (completedTasks / totalTasks) * 100;
        
        // Ibabalik ang sagot bilang integer (walang decimal) sa Node.js
        std::cout << (int)percentage;
    } else {
        std::cout << 0;
    }

    return 0;
}
